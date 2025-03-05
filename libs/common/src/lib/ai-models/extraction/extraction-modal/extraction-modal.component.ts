import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeaturesService } from '@flaps/core';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExtractConfig, ExtractVLLMConfig, LearningConfigurations } from '@nuclia/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { LLMConfigurationComponent } from './llm-configuration.component';

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

  generativeModels = this.modal.config.data?.learningConfigurations?.['generative_model']?.options || [];
  id = this.modal.config.data?.id;
  config = this.modal.config.data?.config;
  createMode = !this.id;

  aiTablesEnabled = this.features.unstable.aiTableProcessing;
  visualLLMEnabled = this.features.unstable.visualLLMProcessing;

  vllmConfig?: ExtractVLLMConfig;
  aiTables?: ExtractVLLMConfig;

  configForm = new FormGroup({
    name: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    processing: new FormControl< 'ai_tables' | 'vllm_config' | 'none'>('none', { nonNullable: true }),
    split: new FormGroup({
      max_paragraph: new FormControl<number | null>(null, { nonNullable: true }),
    }),
  });

  validationMessages = {
    name: { required: 'validation.required' },
  };

  get processing() {
    return this.configForm.controls.processing.value;
  }

  constructor(
    private modal: ModalRef<
      { learningConfigurations: LearningConfigurations; id?: string; config?: ExtractConfig },
      ExtractConfig
    >,
  ) {}

  ngOnInit() {
    if (this.config) {
      this.configForm.patchValue({
        name: this.config.name,
        processing: !!this.config.vllm_config ? 'vllm_config' : !!this.config.ai_tables ? 'ai_tables' : 'none',
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
    let payload: ExtractConfig = {
      name: values.name,
    };
    if (values.processing === 'ai_tables') {
      payload.ai_tables = this.aiTables;
    }
    if (values.processing === 'vllm_config') {
      payload.vllm_config = this.vllmConfig;
    }
    if (values.split.max_paragraph) {
      payload.split = {
        max_paragraph: values.split.max_paragraph,
      };
    }
    this.modal.close(payload);
  }

  close(): void {
    this.modal.close();
  }
}
