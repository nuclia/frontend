import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UiToastService } from '@nuclia/ui/toast';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, filter, forkJoin, map, of, shareReplay, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { ManagerStore } from '../../../../manager.store';
import { AsyncPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmSelectImports } from '@nuclia/ui-spartan/select';
import { RegionalAccountService } from '../../../regional-account.service';
import { ZoneService } from '../../../../manage-zones/zone.service';
import { ModelType } from '@nuclia/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { convertEnumProperties } from '@flaps/common';
import { UserKeysComponent, UserKeysForm } from './user-keys/user-keys.component';

@Component({
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    UserKeysComponent,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports,
  ],
  templateUrl: './add-model.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddModelComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();

  modelForm = new FormGroup({
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    model_types: new FormControl<ModelType[]>([], {
      nonNullable: true,
      validators: [Validators.required],
    }),
    location: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[^:\s]+:[^:\s]+$/)],
    }),
    zone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  modelTypes = Object.values(ModelType);
  zones = toSignal(
    this.zoneService.getZoneDict().pipe(
      map((zones) => Object.values(zones).map((zone) => ({ value: zone.slug, label: zone.title }))),
      tap((options) => {
        if (!this.zoneControl.value) this.zoneControl.patchValue(options[0].value);
      }),
    ),
    { initialValue: [] },
  );
  zoneLabel = (slug: string) => this.zones().find((zone) => zone.value === slug)?.label ?? slug;
  schema = this.zoneService.getZoneDict().pipe(
    switchMap((zones) =>
      this.sdk.nuclia.db.getLearningSchema(this.store.getAccountId() || '', Object.values(zones)[0].slug),
    ),
    shareReplay(1),
  );
  openaiCompat = this.schema.pipe(
    map((schema) => schema['generative_model']?.options?.find((model) => model.value === 'openai-compatible')),
  );
  isSaving = false;
  addModel = true;
  modelId?: string;
  userKeysForm?: UserKeysForm;

  get zoneControl() {
    return this.modelForm.controls.zone;
  }

  get name() {
    return this.modelForm.controls.description.value;
  }

  get pristine() {
    return this.modelForm.pristine && this.userKeysForm?.pristine;
  }

  get invalid() {
    return this.modelForm.invalid || this.userKeysForm?.invalid;
  }

  constructor(
    private store: ManagerStore,
    private regionalService: RegionalAccountService,
    private sdk: SDKService,
    private zoneService: ZoneService,
    private toast: UiToastService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    combineLatest([
      this.store.accountDetails.pipe(filter((accountDetails) => !!accountDetails)),
      this.route.params.pipe(map((params) => params['modelId'])),
      this.route.params.pipe(map((params) => params['zoneSlug'])),
    ])
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter(([, modelId]) => !!modelId),
        tap(([, modelId]) => (this.modelId = modelId)),
        switchMap(([account, modelId, zoneSlug]) =>
          forkJoin([
            this.sdk.nuclia.db.getModel(modelId, account.id, zoneSlug),
            this.sdk.nuclia.db.getModels(account.id, zoneSlug),
            this.schema.pipe(take(1)),
            of(zoneSlug as string),
          ]),
        ),
      )
      .subscribe(([model, models, schema, zoneSlug]) => {
        this.addModel = false;
        this.zoneControl.disable();
        const { model_types, openai_compat: rawOpenaiCompat, ...values } = model;
        let openai_compat = rawOpenaiCompat;
        const description = models.find((item) => item.model_id === model.model_id)?.title || '';
        this.modelForm.patchValue({
          ...values,
          description,
          location: values.location || undefined,
          model_types: model_types || [],
          zone: zoneSlug,
        });

        if (openai_compat) {
          const openaiCompatSchema = schema?.['user_keys']?.schemas?.['openai_compat'];
          if (openaiCompatSchema) {
            openai_compat = convertEnumProperties(openai_compat, openaiCompatSchema);
          }
        }

        setTimeout(() => {
          // Wait for the userKeysForm to be ready
          this.userKeysForm?.controls.enabled?.patchValue(!!openai_compat);
          this.userKeysForm?.controls.user_keys?.patchValue(openai_compat);
        });
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    this.isSaving = true;
    this.cdr.markForCheck();
    const { zone, model_types, ...formValues } = this.modelForm.getRawValue();
    const userKeys = this.userKeysForm?.getRawValue();
    const openai_compat = userKeys?.enabled ? userKeys.user_keys : null;
    const payload = {
      ...formValues,
      model_types,
      openai_compat,
    };
    const accountId = this.store.getAccountId();
    if (accountId) {
      const request = this.addModel
        ? this.regionalService.createModel(payload, accountId, zone)
        : this.regionalService.updateModel(payload, this.modelId || '', accountId, zone);
      request.subscribe({
        next: () => {
          this.router.navigate([`/accounts/${accountId}/models`]);
        },
        error: () => {
          this.toast.error(`${this.addModel ? 'Adding' : 'Updating'} model failed`);
          this.isSaving = false;
          this.cdr.markForCheck();
        },
      });
    }
  }
}
