import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CustomSplitStrategy, LearningConfigurations, SplitLLMConfig, SplitStrategy } from '@nuclia/core';
import { LLMConfigurationComponent } from '../llm-configuration/llm-configuration.component';

@Component({
  imports: [
    CommonModule,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    LLMConfigurationComponent,
  ],
  templateUrl: './split-modal.component.html',
  styleUrls: ['./split-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitModalComponent implements OnInit {
  generativeModels = this.modal.config.data?.learningConfigurations?.['generative_model']?.options || [];
  id = this.modal.config.data?.id;
  config = this.modal.config.data?.config;
  createMode = !this.id;

  llmSplit?: SplitLLMConfig;

  configForm = new FormGroup({
    name: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    custom_split: new FormControl<'default' | 'manual' | 'llm'>('default', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    manual_split: new FormGroup({
      splitter: new FormControl<string>('', { nonNullable: true }),
    }),
    max_paragraph: new FormControl<number | null>(null, { nonNullable: true }),
  });

  validationMessages = {
    name: { required: 'validation.required' },
  };

  get type() {
    return this.configForm.controls.custom_split.value;
  }

  constructor(
    private modal: ModalRef<
      { learningConfigurations: LearningConfigurations; id?: string; config?: SplitStrategy },
      SplitStrategy
    >,
  ) {}

  ngOnInit() {
    if (this.config) {
      const { custom_split, ...rest } = this.config;
      this.configForm.patchValue({
        ...rest,
        custom_split:
          custom_split === CustomSplitStrategy.LLM
            ? 'llm'
            : custom_split === CustomSplitStrategy.MANUAL
              ? 'manual'
              : 'default',
      });
      this.configForm.disable();
    }
  }

  save() {
    if (!this.configForm.valid) {
      return;
    }
    const values = this.configForm.getRawValue();
    let payload: SplitStrategy = {
      name: values.name,
      custom_split:
        values.custom_split === 'llm'
          ? CustomSplitStrategy.LLM
          : values.custom_split === 'manual'
            ? CustomSplitStrategy.MANUAL
            : CustomSplitStrategy.NONE,
    };
    if (this.type === 'manual') {
      payload.manual_split = values.manual_split;
    }
    if (this.type === 'llm') {
      payload.llm_split = this.llmSplit;
    }
    if (values.max_paragraph) {
      payload.max_paragraph = values.max_paragraph;
    }
    this.modal.close(payload);
  }

  close(): void {
    this.modal.close();
  }
}
