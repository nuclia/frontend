import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormControlStatus, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeaturesService, SDKService } from '@flaps/core';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExtractConfig, ExtractVLLMConfig, GenerativeProviders, LearningConfigurations } from '@nuclia/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { LLMConfigurationComponent } from '../llm-configuration/llm-configuration.component';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  defer,
  distinctUntilChanged,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs';

@Component({
  imports: [
    CommonModule,
    InfoCardComponent,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    LLMConfigurationComponent,
  ],
  templateUrl: './extraction-modal.component.html',
  styleUrls: ['./extraction-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtractionModalComponent implements OnInit {
  features = inject(FeaturesService);
  sdk = inject(SDKService);

  providers = this.modal.config.data?.providers || {};
  learningConfigurations = this.modal.config.data?.learningConfigurations || {};
  id = this.modal.config.data?.id;
  config = this.modal.config.data?.config;
  createMode = !this.id;

  aiTablesEnabled = this.features.authorized.aiTableProcessing;
  visualLLMEnabled = this.features.authorized.visualLLMProcessing;

  vllmConfig = new BehaviorSubject<ExtractVLLMConfig | undefined>(undefined);
  vllmConfigStatus = new BehaviorSubject<FormControlStatus | undefined>(undefined);

  aiTables = new BehaviorSubject<ExtractVLLMConfig | undefined>(undefined);
  aiTablesStatus = new BehaviorSubject<FormControlStatus | undefined>(undefined);

  configForm = new FormGroup({
    name: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    max_parallel_llm_calls: new FormControl<number>(5, { validators: [Validators.min(0)], nonNullable: true }),
    vllm_config: new FormControl<boolean>(false, { nonNullable: true }),
    ai_tables: new FormControl<boolean>(false, { nonNullable: true }),
  });

  validationMessages = {
    name: { required: 'validation.required' },
  };

  showMaxParallelCalls = combineLatest([
    this.features.isAccountManager,
    defer(() => this.configForm.controls.vllm_config.valueChanges.pipe(startWith(this.vllm_config))),
    defer(() => this.configForm.controls.ai_tables.valueChanges.pipe(startWith(this.ai_tables))),
    this.vllmConfig.pipe(
      map((config) => config?.llm?.generative_model),
      distinctUntilChanged(),
    ),
    this.aiTables.pipe(
      map((config) => config?.llm?.generative_model),
      distinctUntilChanged(),
    ),
  ]).pipe(
    switchMap(([isAccountManager, vllmEnabled, aiTablesEnabled, vllmModel, aiTablesModel]) =>
      isAccountManager ? this.allModelsHaveKeys(vllmEnabled, aiTablesEnabled, vllmModel, aiTablesModel) : of(false),
    ),
    shareReplay(1),
  );

  get vllm_config() {
    return this.configForm.controls.vllm_config.value;
  }

  get ai_tables() {
    return this.configForm.controls.ai_tables.value;
  }

  get invalid() {
    return (
      this.configForm.invalid ||
      (this.vllm_config && this.vllmConfigStatus.value !== 'VALID') ||
      (this.ai_tables && this.aiTablesStatus.value !== 'VALID')
    );
  }

  constructor(
    private modal: ModalRef<
      {
        providers: GenerativeProviders;
        learningConfigurations: LearningConfigurations;
        id?: string;
        config?: ExtractConfig;
      },
      ExtractConfig
    >,
  ) {}

  ngOnInit() {
    if (this.config) {
      this.configForm.patchValue({
        name: this.config.name,
        max_parallel_llm_calls: this.config.max_parallel_llm_calls,
        vllm_config: !!this.config.vllm_config,
        ai_tables: !!this.config.ai_tables,
      });
      this.configForm.disable();
    }
  }

  save() {
    if (!this.configForm.valid) {
      return;
    }
    this.showMaxParallelCalls.pipe(take(1)).subscribe((showParallelCalls) => {
      const values = this.configForm.getRawValue();
      const payload: ExtractConfig = {
        name: values.name,
      };
      if (showParallelCalls) {
        payload.max_parallel_llm_calls = values.max_parallel_llm_calls;
      }
      if (values.vllm_config) {
        payload.vllm_config = this.vllmConfig.value;
      }
      if (values.ai_tables) {
        payload.ai_tables = this.aiTables.value;
      }
      this.modal.close(payload);
    });
  }

  close(): void {
    this.modal.close();
  }

  allModelsHaveKeys(
    vllmEnabled: boolean,
    aiTablesEnabled: boolean,
    vllmModel?: string,
    aiTablesModel?: string,
  ): Observable<boolean> {
    if ((vllmEnabled && vllmModel) || (aiTablesEnabled && aiTablesModel)) {
      const vllmHasKey = vllmModel ? this.isCustomModelWithKeys(vllmModel) : of(false);
      const aiTablesHasKey = aiTablesModel ? this.isCustomModelWithKeys(aiTablesModel) : of(false);
      return forkJoin([vllmHasKey, aiTablesHasKey]).pipe(
        map(
          ([vllmHasKey, aiTablesHasKey]) =>
            (!vllmEnabled || (vllmEnabled && vllmHasKey)) && (!aiTablesEnabled || (aiTablesEnabled && aiTablesHasKey)),
        ),
      );
    } else {
      return of(false);
    }
  }

  isCustomModelWithKeys(model: string): Observable<boolean> {
    const customModel = Object.values(this.providers['default']?.models).find((modelInfo) => modelInfo.name === model);
    return customModel
      ? this.sdk.currentAccount.pipe(
          take(1),
          switchMap((modelConfig) =>
            this.sdk.nuclia.db.getModelConfiguration(
              customModel.name.split('/')[1],
              modelConfig.id,
              this.sdk.nuclia.options.zone || '',
            ),
          ),
          map((model) => !!model.user_keys),
          catchError(() => of(false)),
        )
      : of(false);
  }
}
