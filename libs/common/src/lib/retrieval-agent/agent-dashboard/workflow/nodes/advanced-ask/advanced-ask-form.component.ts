import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BaseContextAgent, ChatOptions, SearchOptions, Widget } from '@nuclia/core';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { DriverSelectComponent } from '../../basic-elements/node-form/subcomponents/driver-select';
import { JSONSchema4 } from 'json-schema';
import { ModelSelectComponent } from '../../basic-elements/node-form/subcomponents/model-select/model-select.component';
import { AskConfigurationComponent } from './ask-configuration.component';
import { getChatOptions, getFindOptions, getSearchConfigFromSearchOptions } from '../../../../../search-widget';

@Component({
  selector: 'app-advanced-ask-form',
  imports: [
    AskConfigurationComponent,
    ConfigurationFormComponent,
    DriverSelectComponent,
    forwardRef(() => ModelSelectComponent), // Avoid circular dependency
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    RulesFieldComponent,
    TranslateModule,
  ],
  templateUrl: './advanced-ask-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedAskFormComponent extends FormDirective implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  @Input() schemas?: JSONSchema4 | null;
  @Output() formReady = new EventEmitter<FormGroup>();

  schema?: JSONSchema4;
  kind?: 'find' | 'ask' = 'ask';
  searchOptions: SearchOptions | ChatOptions = {};
  initialSearchConfig?: Widget.SearchConfiguration;

  override form = new FormGroup({
    advanced_ask: new FormGroup({
      sources: new FormArray<FormControl<string>>([], { validators: [Validators.required] }),
      fallback: new FormControl<BaseContextAgent | null>(null),
      generative_model: new FormControl<string>('', { nonNullable: true }),
      rephrase_model: new FormControl<string>('', { nonNullable: true }),
      summarize_model: new FormControl<string>('', { nonNullable: true }),
      max_retries: new FormControl<number | null>(1),
      rules: new FormArray<FormControl<string>>([]),
    }),
  });
  override get configForm() {
    return this.form.controls.advanced_ask;
  }

  override submit(): void {
    const value = {
      generate_answer: this.kind === 'ask',
      ...this.searchOptions,
      ...this.processFormValue(this.configForm.getRawValue()),
    };
    this.submitForm.emit(value);
  }

  ngOnInit() {
    const { schema } = this.buildFormFromSchema(this.schemas || null, 'advanced_ask');
    this.schema = schema;
    Object.keys(this.configForm.controls).forEach((field) => {
      if (schema.properties?.[field]?.default) {
        this.configForm.get(field)?.patchValue(schema.properties?.[field].default);
      }
      this.cdr.markForCheck();
    });
    this.formReady.emit(this.configForm);

    if (this.config) {
      const { generate_answer, generative_model, ...rest } = this.config as any;
      this.initialSearchConfig = getSearchConfigFromSearchOptions('', {
        kind: generate_answer ? 'ask' : 'find',
        config: rest as ChatOptions,
      });
      this.cdr.markForCheck();
    }
  }

  updateConfig(config: any) {
    const searchConfig: Widget.SearchConfiguration = {
      id: '',
      routing: {
        useRouting: false,
      },
      ...config,
    };
    this.kind = config.generativeAnswer.generateAnswer ? 'ask' : 'find';
    this.searchOptions = this.kind === 'ask' ? getChatOptions(searchConfig) : getFindOptions(searchConfig);
  }
}
