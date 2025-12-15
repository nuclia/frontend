import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserKeysComponent, UserKeysForm } from '@flaps/common';
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

  schema = combineLatest([
    this.sdk.currentAccount,
    defer(() =>
      this.configForm.controls.zone.valueChanges.pipe(
        startWith(this.configForm.controls.zone.value),
        filter((zone) => !!zone),
      ),
    ),
  ]).pipe(
    switchMap(([account, zone]) => this.sdk.nuclia.db.getLearningSchema(account.id, zone)),
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
  currentZone = defer(() =>
    this.configForm.controls.zone.valueChanges.pipe(startWith(this.configForm.controls.zone.value)),
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
      return isBedrockModel && this.bedrockZones.some((zone) => zone.slug === currentZone);
    }),
  );
  isBedrockIntegrationEnabled = this.features.unstable.bedrockIntegration;

  zoneOptions = this.zones.map((zone) => new OptionModel({ id: zone.id, value: zone.slug, label: zone.title || '' }));
  generativeModelOptions = this.schema.pipe(
    map((schema) =>
      (schema['generative_model']?.options || [])
        .filter((option) => !option.value.includes('/')) // Filter out model configurations
        .map((option) => new OptionModel({ id: option.value, value: option.value, label: option.name })),
    ),
  );

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
      this.configForm.disable();

      this.generativeModel.pipe(take(1)).subscribe((model) => {
        const prompts = (this.config?.user_prompts || {})[model.user_prompt || ''];
        this.promptsForm.patchValue(prompts || {});
        this.promptsForm.disable();
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
        this.userKeysForm?.disable();
      });
    }
  }

  save() {
    if (this.configForm.invalid || this.userKeysForm?.invalid) {
      return;
    }
    forkJoin([
      this.generativeModel.pipe(take(1)),
      this.userPrompt.pipe(take(1)),
      this.systemPrompt.pipe(take(1)),
    ]).subscribe(([model, userPrompt, systemPrompt]) => {
      const { useBedrock, ...values } = this.configForm.getRawValue();
      const userKeys = this.userKeysForm?.getRawValue();
      const prompts = {
        prompt: !!userPrompt ? this.promptsForm.value.prompt?.trim() : '',
        system: !!systemPrompt ? this.promptsForm.value.system?.trim() : '',
      };
      this.modal.close({
        ...values,
        user_keys: userKeys?.enabled ? { [model.user_key || '']: userKeys?.user_keys } : null,
        user_prompts: prompts.prompt || prompts.system ? { [model.user_prompt || '']: prompts } : null,
        assume_role: useBedrock ? AssumeRole.BEDROCK : undefined,
      });
    });
  }

  close(): void {
    this.modal.close();
  }
}
