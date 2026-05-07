import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormArray, FormControl, FormControlStatus, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExtractVLLMConfig, GenerativeProviders, LearningConfigurations, ReasoningConfig } from '@nuclia/core';
import { ButtonMiniComponent, ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { startWith, Subject, takeUntil } from 'rxjs';
import { ModelSelectorComponent, ReasoningConfigComponent } from '../../answer-generation';

@Component({
  imports: [
    ButtonMiniComponent,
    ModelSelectorComponent,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    ReasoningConfigComponent,
    TranslateModule,
    InfoCardComponent,
    ExpandableTextareaComponent,
  ],
  selector: 'stf-llm-configuration',
  templateUrl: './llm-configuration.component.html',
  styleUrls: ['./llm-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LLMConfigurationComponent implements OnDestroy, OnInit {
  providers = input<GenerativeProviders>({});
  learningConfigurations = input<LearningConfigurations>({});
  @Input() createMode = true;
  @Input() vllmOnly = false;
  @Input() isAiTable = false;
  @Input() config: ExtractVLLMConfig | undefined;
  @Input() rulesDescription: string | undefined;
  @Input() rulesPlaceholder: string | undefined;

  @Output() valueChange = new EventEmitter<ExtractVLLMConfig>();
  @Output() statusChange = new EventEmitter<FormControlStatus>();
  private unsubscribeAll = new Subject<void>();

  configForm = new FormGroup({
    rules: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
    customRules: new FormControl<boolean>(false, { nonNullable: true }),
    merge_pages: new FormControl<boolean>(false, { nonNullable: true }),
    max_pages_to_merge: new FormControl<number>(3, { nonNullable: true }),
    modelType: new FormControl<'default' | 'custom'>('default', { nonNullable: true }),
    llm: new FormGroup({
      generative_model: new FormControl<string>('', { nonNullable: true }),
    }),
  });
  reasoningConfig?: ReasoningConfig;
  reasoningDisabled = false;

  pagehoundModel = 'pagehound-v1';
  hasPagehound = computed(
    () =>
      !!this.learningConfigurations()['generative_model'].options?.some((model) => model.value === this.pagehoundModel),
  );  
  visualProviders = computed(() =>
    Object.fromEntries(
      Object.entries(this.providers()).map(([key, provider]) => [
        key,
        {
          ...provider,
          models: Object.fromEntries(Object.entries(provider.models).filter(([, model]) => !!model.features.vision)),
        },
      ]),
    ),
  );

  get useCustomModel() {
    return this.configForm.controls.modelType.value === 'custom';
  }
  get modelTypeControl() {
    return this.configForm.controls.modelType;
  }
  get generativeModelControl() {
    return this.configForm.controls.llm.controls.generative_model;
  }
  get useCustomRules() {
    return this.configForm.controls.customRules.value;
  }
  get rulesDisabled() {
    return !this.useCustomModel && this.vllmOnly;
  }
  get rules() {
    return this.configForm.controls.rules;
  }
  get mergePages() {
    return this.configForm.controls.merge_pages.value;
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  ngOnInit() {
    if (this.config) {
      this.rules.clear();
      (this.config.rules || []).forEach(() => {
        this.addRule();
      });
      const isDefaultModel = this.vllmOnly
        ? this.config.llm?.generative_model === this.pagehoundModel
        : !this.config.llm;
      this.configForm.patchValue({
        modelType: isDefaultModel ? 'default' : 'custom',
        merge_pages: this.config.merge_pages || false,
        max_pages_to_merge: this.config.max_pages_to_merge || 3,
        rules: this.config.rules,
        customRules: (this.config.rules || []).length > 0,
        llm: {
          generative_model: this.config.llm?.generative_model || '',
        },
      });
      this.reasoningConfig = this.config.llm?.reasoning_config;
      this.reasoningDisabled = true;
      this.configForm.disable();
    }

    this.configForm.valueChanges
      .pipe(startWith(this.configForm.getRawValue()), takeUntil(this.unsubscribeAll))
      .subscribe(() => {
        const values = this.configForm.getRawValue();
        this.valueChange.emit({
          llm: this.useCustomModel
            ? {
                generative_model: values.llm.generative_model,
                reasoning_config: this.reasoningConfig,
              }
            : undefined,
          merge_pages: this.isAiTable ? values.merge_pages : undefined,
          max_pages_to_merge: values.merge_pages ? values.max_pages_to_merge : undefined,
          rules:
            values.customRules && !this.rulesDisabled
              ? values.rules.map((line) => line.trim()).filter((line) => !!line)
              : [],
        });
        this.generativeModelControl.setValidators(this.useCustomModel ? [Validators.required] : []);
        this.generativeModelControl.updateValueAndValidity({ emitEvent: false });
      });

    this.configForm.statusChanges
      .pipe(startWith(this.configForm.status), takeUntil(this.unsubscribeAll))
      .subscribe((status) => {
        this.statusChange.emit(status);
      });
  }

  addRule() {
    this.rules.push(new FormControl<string>('', { nonNullable: true }));
  }

  removeRule(index: number) {
    this.rules.removeAt(index);
  }

  onReasoningChange() {
    // Emit updated value
    this.configForm.updateValueAndValidity();
  }

  onTypeChanges(type: 'default' | 'custom') {
    if (type === 'default' && this.vllmOnly) {
      this.configForm.controls.customRules.setValue(false);
    }
  }
}
