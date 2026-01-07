import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormArray, FormControl, FormControlStatus, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExtractVLLMConfig, GenerativeProviders } from '@nuclia/core';
import { ButtonMiniComponent, ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { startWith, Subject, takeUntil } from 'rxjs';
import { ModelSelectorComponent } from '../../answer-generation';
import { FeaturesService } from '@flaps/core';

@Component({
  imports: [
    ButtonMiniComponent,
    CommonModule,
    ModelSelectorComponent,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
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
  features = inject(FeaturesService);

  @Input() providers: GenerativeProviders = {};
  @Input() createMode: boolean = true;
  @Input() vllmOnly: boolean = false;
  @Input() isAiTable: boolean = false;
  @Input() config: ExtractVLLMConfig | undefined;
  @Input() rulesDescription: string | undefined;
  @Input() rulesPlaceholder: string | undefined;

  @Output() valueChange = new EventEmitter<ExtractVLLMConfig>();
  @Output() statusChange = new EventEmitter<FormControlStatus>();
  modelsDisclaimer = this.features.unstable.modelsDisclaimer;
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
  get generativeModelControl() {
    return this.configForm.controls.llm.controls.generative_model;
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
          llm: values.customLLM ? { generative_model: values.llm.generative_model } : undefined,
          merge_pages: this.isAiTable ? values.merge_pages : undefined,
          max_pages_to_merge: values.merge_pages ? values.max_pages_to_merge : undefined,
          rules: values.rules.map((line) => line.trim()).filter((line) => !!line),
        });
        this.generativeModelControl.setValidators(values.customLLM ? [Validators.required] : []);
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
}
