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
import { LLMConfigurationComponent } from '../llm-configuration/llm-configuration.component';

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
    vllm_config: new FormControl<boolean>(false, { nonNullable: true }),
    ai_tables: new FormControl<boolean>(false, { nonNullable: true }),
  });

  validationMessages = {
    name: { required: 'validation.required' },
  };

  get vllm_config() {
    return this.configForm.controls.vllm_config.value;
  }

  get ai_tables() {
    return this.configForm.controls.ai_tables.value;
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
    const values = this.configForm.getRawValue();
    let payload: ExtractConfig = {
      name: values.name,
    };
    if (values.vllm_config) {
      payload.vllm_config = this.vllmConfig;
    }
    if (values.ai_tables) {
      payload.ai_tables = this.aiTables;
    }
    this.modal.close(payload);
  }

  close(): void {
    this.modal.close();
  }
}
