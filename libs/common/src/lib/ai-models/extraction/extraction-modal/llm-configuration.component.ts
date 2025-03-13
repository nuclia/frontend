import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExtractLLMConfig, ExtractVLLMConfig, LearningConfigurationOption } from '@nuclia/core';
import { ButtonMiniComponent } from '@nuclia/sistema';
import { startWith, Subject, takeUntil } from 'rxjs';

@Component({
  imports: [
    ButtonMiniComponent,
    CommonModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  selector: 'stf-llm-configuration',
  templateUrl: './llm-configuration.component.html',
  styleUrls: ['./llm-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LLMConfigurationComponent implements OnDestroy, OnInit {
  @Input() generativeModels: LearningConfigurationOption[] = [];
  @Input() createMode: boolean = true;
  @Input() isAiTable: boolean = false;
  @Input() config: ExtractVLLMConfig | undefined;

  @Output() valueChange = new EventEmitter<ExtractVLLMConfig>();
  private unsubscribeAll = new Subject<void>();

  configForm = new FormGroup({
    rules: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
    merge_pages: new FormControl<boolean>(false, { nonNullable: true }),
    max_pages_to_merge: new FormControl<number>(3, { nonNullable: true }),
    customLLM: new FormControl<boolean>(false, { nonNullable: true }),
    llm: new FormGroup({
      generative_model: new FormControl<string>('', { nonNullable: true }),
      //generative_prompt_id: new FormControl<string>('', { nonNullable: true }),
    }),
  });

  get useCustomModel() {
    return this.configForm.controls.customLLM.value;
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
      (this.config?.rules || []).forEach(() => {
        this.addRule();
      });
      this.configForm.patchValue({
        customLLM: !!this.config?.llm,
        merge_pages: this.config?.merge_pages || false,
        max_pages_to_merge: this.config?.max_pages_to_merge || 3,
        rules: this.config?.rules,
        llm: {
          generative_model: this.config?.llm?.generative_model || '',
        },
      });
      this.configForm.disable();
    }

    this.configForm.valueChanges
      .pipe(startWith(this.configForm.getRawValue()), takeUntil(this.unsubscribeAll))
      .subscribe(() => {
        const values = this.configForm.getRawValue();
        this.valueChange.emit({
          llm: values.customLLM ? this.getLLMConfig(values.llm.generative_model) : undefined,
          merge_pages: values.merge_pages,
          max_pages_to_merge: values.merge_pages ? values.max_pages_to_merge : undefined,
          rules: values.rules.map((line) => line.trim()).filter((line) => !!line),
        });
      });
  }

  addRule() {
    this.rules.push(new FormControl<string>('', { nonNullable: true }));
  }

  removeRule(index: number) {
    this.rules.removeAt(index);
  }

  getLLMConfig(model?: string): ExtractLLMConfig {
    const modelOption = this.getGenerativeModel(model || '');
    return {
      generative_model: model || undefined,
      generative_provider: model ? modelOption?.provider : undefined,
    };
  }

  getGenerativeModel(value: string) {
    return this.generativeModels.find((model) => model.value === value);
  }
}
