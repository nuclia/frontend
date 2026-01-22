import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeaturesService, SDKService, Zone } from '@flaps/core';
import {
  ModalRef,
  OptionModel,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AssumeRole, ModelConfiguration, ModelConfigurationCreation } from '@nuclia/core';
import { combineLatest, defer, filter, forkJoin, map, shareReplay, startWith, switchMap, take } from 'rxjs';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { UserKeysComponent, UserKeysForm } from '../../../ai-models';

@Component({
  imports: [
    CommonModule,
    ExpandableTextareaComponent,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    UserKeysComponent,
  ],
  templateUrl: './create-config.component.html',
  styleUrls: ['./create-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateConfigComponent implements OnInit {
  sdk = inject(SDKService);
  features = inject(FeaturesService);

  zones = this.modal.config.data?.zones || [];
  bedrockZones = this.modal.config.data?.bedrockZones || [];
  config = this.modal.config.data?.config;
  zone = this.modal.config.data?.zone;
  createMode = !this.config;

  configForm = new FormGroup({
    default_model_id: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    description: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    zone: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    useBedrock: new FormControl<boolean>(false, { nonNullable: true }),
  });
  promptsForm = new FormGroup({
    prompt: new FormControl<string>('', { nonNullable: true }),
    system: new FormControl<string>('', { nonNullable: true }),
  });
  userKeysForm?: UserKeysForm;

  validationMessages = {
    description: { required: 'validation.required' },
  };

  currentZone = defer(() =>
    this.configForm.controls.zone.valueChanges.pipe(startWith(this.configForm.controls.zone.value)),
  ).pipe(map((current) => this.zones.find((zone) => zone.slug === current)));

  schema = combineLatest([this.sdk.currentAccount, this.currentZone.pipe(filter((zone) => !!zone))]).pipe(
    switchMap(([account, zone]) => this.sdk.nuclia.db.getLearningSchema(account.id, zone.slug)),
    shareReplay(1),
  );

  generativeModel = combineLatest([
    this.schema,
    defer(() =>
      this.configForm.controls.default_model_id.valueChanges.pipe(
        startWith(this.configForm.controls.default_model_id.value),
      ),
    ),
  ]).pipe(
    map(([schema, model]) => (schema['generative_model']?.options || []).find((option) => option.value === model)),
    filter((value) => !!value),
  );

  prompts = combineLatest([this.schema, this.generativeModel]).pipe(
    map(([schema, model]) => schema['user_prompts']?.schemas?.[model.user_prompt || '']),
  );
  userPrompt = this.prompts.pipe(map((prompts) => prompts?.properties?.['prompt']));
  systemPrompt = this.prompts.pipe(map((prompts) => prompts?.properties?.['system']));
  showAssumeRole = combineLatest([this.generativeModel, this.currentZone]).pipe(
    map(([model, currentZone]) => {
      // TODO: use "generative_providers" endpoint to know which are Bedrock models
      const isBedrockModel = model.provider === 'bedrock' || model.name.toLocaleLowerCase().includes('bedrock');
      return isBedrockModel && this.bedrockZones.some((zone) => zone.slug === currentZone?.slug);
    }),
  );
  isBedrockIntegrationEnabled = this.features.unstable.bedrockIntegration;

  zoneOptions = this.zones.map((zone) => new OptionModel({ id: zone.id, value: zone.slug, label: zone.title || '' }));
  generativeModelOptions = this.schema.pipe(
    map((schema) =>
      (schema['generative_model']?.options || [])
        .filter((option) => !option.value.includes('/')) // Filter out model configurations
        .map(
          (option) =>
            new OptionModel({ id: option.value, value: option.value, label: option.name, help: option.value }),
        ),
    ),
  );

  isRestricted = false;
  selectedKbs: { [key: string]: boolean } = {};
  kbList = combineLatest([this.sdk.kbList, this.sdk.aragList, this.currentZone]).pipe(
    map(([kbs, arags, zone]) => kbs.concat(arags).filter((item) => item.zone === zone?.slug)),
  );

  get invalid() {
    return this.configForm.invalid || this.userKeysForm?.invalid;
  }

  constructor(
    private modal: ModalRef<
      { zones: Zone[]; bedrockZones: Zone[]; config?: ModelConfiguration; zone?: string },
      ModelConfigurationCreation
    >,
  ) {}

  ngOnInit() {
    if (this.config && this.zone) {
      this.configForm.patchValue({
        ...this.config,
        zone: this.zone,
        useBedrock: this.config.assume_role === AssumeRole.BEDROCK,
      });

      this.isRestricted = (this.config.kbids || []).length > 0;
      this.selectedKbs = (this.config.kbids || []).reduce(
        (acc, curr) => {
          acc[curr] = true;
          return acc;
        },
        {} as { [key: string]: boolean },
      );

      this.generativeModel.pipe(take(1)).subscribe((model) => {
        const prompts = (this.config?.user_prompts || {})[model.user_prompt || ''];
        this.promptsForm.patchValue(prompts || {});
      });
    } else {
      if (!this.configForm.value.zone && this.zones[0]) {
        this.configForm.controls.zone.setValue(this.zones[0].slug);
      }
    }
  }

  initUserKeys(userKeysForm: UserKeysForm) {
    this.userKeysForm = userKeysForm;
    if (this.config) {
      this.generativeModel.pipe(take(1)).subscribe((model) => {
        const userkeys = (this.config?.user_keys || {})[model.user_key || ''];
        this.userKeysForm?.patchValue({
          enabled: !!userkeys,
          user_keys: userkeys,
        });
      });
    }
  }

  save() {
    if (this.invalid) {
      return;
    }
    forkJoin([
      this.generativeModel.pipe(take(1)),
      this.userPrompt.pipe(take(1)),
      this.systemPrompt.pipe(take(1)),
      this.kbList.pipe(take(1)),
    ]).subscribe(([model, userPrompt, systemPrompt, kbList]) => {
      const { useBedrock, ...values } = this.configForm.getRawValue();
      const userKeys = this.userKeysForm?.getRawValue();
      const prompts = {
        prompt: !!userPrompt ? this.promptsForm.value.prompt?.trim() : '',
        system: !!systemPrompt ? this.promptsForm.value.system?.trim() : '',
      };
      const kbids = this.isRestricted
        ? Object.entries(this.selectedKbs)
            .filter(([id, value]) => !!value && kbList.some((kb) => kb.id === id))
            .map(([id]) => id)
        : [];
      this.modal.close({
        ...values,
        user_keys: userKeys?.enabled ? { [model.user_key || '']: userKeys?.user_keys } : null,
        user_prompts: prompts.prompt || prompts.system ? { [model.user_prompt || '']: prompts } : null,
        assume_role: useBedrock ? AssumeRole.BEDROCK : undefined,
        kbids,
      });
    });
  }

  close(): void {
    this.modal.close();
  }
}
