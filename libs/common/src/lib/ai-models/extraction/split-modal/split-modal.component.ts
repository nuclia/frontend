import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormControlStatus, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  CustomSplitStrategy,
  GenerativeProviders,
  LearningConfigurations,
  SplitLLMConfig,
  SplitStrategy,
} from '@nuclia/core';
import { LLMConfigurationComponent } from '../llm-configuration/llm-configuration.component';

@Component({
  imports: [
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
  providers = this.modal.config.data?.providers || {};
  learningConfigurations = this.modal.config.data?.learningConfigurations || {};
  id = this.modal.config.data?.id;
  config = this.modal.config.data?.config;
  createMode = !this.id;

  llmSplit?: SplitLLMConfig;
  llmSplitStatus?: FormControlStatus;

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
      {
        providers: GenerativeProviders;
        learningConfigurations: LearningConfigurations;
        id?: string;
        config?: SplitStrategy;
      },
      SplitStrategy
    >,
  ) {}

  get invalid() {
    return this.configForm.invalid || (this.type === 'llm' && this.llmSplitStatus !== 'VALID');
  }

  ngOnInit() {
    if (this.config) {
      const { custom_split, ...rest } = this.config;
      let customSplitValue: string;
      if (custom_split === CustomSplitStrategy.LLM) {
        customSplitValue = 'llm';
      } else if (custom_split === CustomSplitStrategy.MANUAL) {
        customSplitValue = 'manual';
      } else {
        customSplitValue = 'default';
      }
      this.configForm.patchValue({
        ...rest,
        custom_split: customSplitValue as 'default' | 'llm' | 'manual',
      });
      this.configForm.disable();
    }
  }

  save() {
    if (!this.configForm.valid) {
      return;
    }
    const values = this.configForm.getRawValue();
    let customSplitStrategy: CustomSplitStrategy;
    if (values.custom_split === 'llm') {
      customSplitStrategy = CustomSplitStrategy.LLM;
    } else if (values.custom_split === 'manual') {
      customSplitStrategy = CustomSplitStrategy.MANUAL;
    } else {
      customSplitStrategy = CustomSplitStrategy.NONE;
    }
    const payload: SplitStrategy = {
      name: values.name,
      custom_split: customSplitStrategy,
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
