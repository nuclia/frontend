import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeaturesService } from '@flaps/core';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExtractConfig, LearningConfigurations } from '@nuclia/core';
import { BadgeComponent, ButtonMiniComponent, InfoCardComponent } from '@nuclia/sistema';

@Component({
  imports: [
    BadgeComponent,
    ButtonMiniComponent,
    CommonModule,
    InfoCardComponent,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './extraction-modal.component.html',
  styleUrls: ['./extraction-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtractionModalComponent implements OnInit {
  features = inject(FeaturesService);

  generativeModels = this.modal.config.data?.learningConfigurations?.['generative_model']?.options || [];
  name = this.modal.config.data?.name;
  config = this.modal.config.data?.config;
  createMode = !this.name;

  aiTablesEnabled = this.features.unstable.aiTableProcessing;
  visualLLMEnabled = this.features.unstable.visualLLMProcessing;

  configForm = new FormGroup({
    name: new FormControl<string>('', {
      validators: [Validators.required, Validators.pattern('[0-9a-zA-Z-]+')],
      nonNullable: true,
    }),
    processing: new FormControl<'ai_tables' | 'vllm_config' | 'none'>('none', { nonNullable: true }),
    vllm_config: new FormGroup({
      rules: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
      customVLLM: new FormControl<boolean>(false, { nonNullable: true }),
      llm: new FormGroup({
        generative_model: new FormControl<string>('', { nonNullable: true }),
        generative_prompt: new FormControl<string>('', { nonNullable: true }),
      }),
    }),
    ai_tables: new FormGroup({
      customLLM: new FormControl<boolean>(false, { nonNullable: true }),
      llm: new FormGroup({
        generative_model: new FormControl<string>('', { nonNullable: true }),
        generative_prompt: new FormControl<string>('', { nonNullable: true }),
      }),
    }),
    split: new FormGroup({
      max_paragraph: new FormControl<number | null>(null, { nonNullable: true }),
    }),
  });

  validationMessages = {
    name: {
      required: 'validation.required',
      pattern: 'kb.ai-models.extraction.config.invalid-name',
    },
  };

  get processing() {
    return this.configForm.controls.processing.value;
  }

  get useCustomLLM() {
    return this.configForm.controls.ai_tables.controls.customLLM.value;
  }

  get useCustomVLLM() {
    return this.configForm.controls.vllm_config.controls.customVLLM.value;
  }

  get rules() {
    return this.configForm.controls.vllm_config.controls.rules;
  }

  constructor(
    private modal: ModalRef<
      { learningConfigurations: LearningConfigurations; name?: string; config?: ExtractConfig },
      { name: string; config: ExtractConfig }
    >,
  ) {}

  ngOnInit() {
    if (this.config) {
      this.rules.clear();
      (this.config.vllm_config?.rules || []).forEach(() => {
        this.addRule();
      });
      this.configForm.patchValue({
        name: this.name,
        processing: !!this.config.vllm_config ? 'vllm_config' : !!this.config.ai_tables ? 'ai_tables' : 'none',
        vllm_config: {
          customVLLM: !!this.config.vllm_config?.llm,
          rules: this.config.vllm_config?.rules,
          llm: this.config.vllm_config?.llm,
        },
        ai_tables: {
          customLLM: !!this.config.ai_tables?.llm,
          llm: this.config.ai_tables?.llm,
        },
        split: this.config.split,
      });
      this.configForm.disable();
    }
  }

  save() {
    if (!this.configForm.valid) {
      return;
    }
    const values = this.configForm.getRawValue();
    let payload: ExtractConfig = {};
    if (values.processing === 'ai_tables') {
      payload.ai_tables = {
        llm: values.ai_tables.customLLM
          ? {
              generative_model: values.ai_tables.llm.generative_model || undefined,
              generative_prompt: values.ai_tables.llm.generative_prompt || undefined,
            }
          : undefined,
      };
    }
    if (values.processing === 'vllm_config') {
      payload.vllm_config = {
        llm: values.vllm_config.customVLLM
          ? {
              generative_model: values.vllm_config.llm.generative_model || undefined,
              generative_prompt: values.ai_tables.llm.generative_prompt || undefined,
            }
          : undefined,
        rules: values.vllm_config.rules.map((line) => line.trim()).filter((line) => !!line),
      };
    }
    if (values.split.max_paragraph) {
      payload.split = {
        max_paragraph: values.split.max_paragraph,
      };
    }
    this.modal.close({ name: values.name, config: payload });
  }

  close(): void {
    this.modal.close();
  }

  addRule() {
    this.rules.push(new FormControl<string>('', { nonNullable: true }));
  }

  removeRule(index: number) {
    this.rules.removeAt(index);
  }
}
