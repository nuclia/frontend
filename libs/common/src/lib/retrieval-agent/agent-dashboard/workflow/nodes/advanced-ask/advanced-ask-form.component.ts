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
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BaseContextAgent, ChatOptions, SearchOptions, Widget } from '@nuclia/core';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { DriverSelectComponent } from '../../basic-elements/node-form/subcomponents/driver-select';
import { JSONSchema4 } from 'json-schema';
import { ModelSelectComponent } from '../../basic-elements/node-form/subcomponents/model-select/model-select.component';
import { AskConfigurationComponent } from './ask-configuration.component';
import { getChatOptions, getFindOptions, getSearchConfigFromSearchOptions } from '../../../../../search-widget';
import { debounceTime, defer, map, of, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { WorkflowService } from '../../workflow.service';
import { InfoCardComponent } from '@nuclia/sistema';

@Component({
  selector: 'app-advanced-ask-form',
  imports: [
    AskConfigurationComponent,
    CommonModule,
    ConfigurationFormComponent,
    DriverSelectComponent,
    InfoCardComponent,
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
  private workflowService = inject(WorkflowService);
  private cdr = inject(ChangeDetectorRef);

  @Input() schemas?: JSONSchema4 | null;
  @Output() formReady = new EventEmitter<FormGroup>();

  schema?: JSONSchema4;
  kind?: 'find' | 'ask' = 'ask';
  searchOptions: SearchOptions | ChatOptions = {};
  initialSearchConfig?: Widget.SearchConfiguration;
  useExistingConfiguration = false;

  override form = new FormGroup({
    advanced_ask: new FormGroup({
      sources: new FormArray<FormControl<string>>([], { validators: [Validators.required] }),
      fallback: new FormControl<BaseContextAgent | null>(null),
      generative_model: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      rephrase_model: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      context_validation_model: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      max_retries: new FormControl<number | null>(1),
      rules: new FormArray<FormControl<string>>([]),
      search_configuration: new FormControl<string>('', { nonNullable: true }),
    }),
  });

  searchConfigurationOptions = defer(() =>
    this.configForm.controls.sources.valueChanges.pipe(startWith(this.sources)),
  ).pipe(
    debounceTime(10), // Wait until the sources values is stable
    switchMap((sources) =>
      sources.length === 1
        ? this.workflowService.fetchDriverSearchConfigurations(sources[0]).pipe(
            map((configs) =>
              Object.entries(configs)
                .filter(([, config]) => config.kind === 'ask')
                .map(([key]) => new OptionModel({ id: key, value: key, label: key })),
            ),
          )
        : of([]),
    ),
    tap((options) => {
      if (!options.some((option) => option.value === this.searchConfiguration)) {
        this.configForm.controls.search_configuration.reset();
        this.cdr.markForCheck();
      }
    }),
    shareReplay(1),
  );

  override get configForm() {
    return this.form.controls.advanced_ask;
  }
  get sources() {
    return this.configForm.controls.sources.value;
  }

  get searchConfigurationControl() {
    return this.configForm.controls.search_configuration;
  }

  get searchConfiguration() {
    return this.searchConfigurationControl.value;
  }

  override submit(): void {
    const { search_configuration, ...formValues } = this.configForm.getRawValue();
    const value = {
      generate_answer: this.useExistingConfiguration ? true : this.kind === 'ask',
      ...(this.useExistingConfiguration ? { search_configuration } : this.searchOptions),
      ...this.processFormValue(formValues),
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
    });
    this.formReady.emit(this.configForm);

    if (this.config) {
      const { generate_answer, generative_model, search_configuration, ...rest } = this.config as any;
      this.useExistingConfiguration = !!search_configuration;
      this.initialSearchConfig = getSearchConfigFromSearchOptions('', {
        kind: generate_answer ? 'ask' : 'find',
        config: rest as ChatOptions,
      });
    }
    this.updateValidators(this.useExistingConfiguration);
    this.cdr.markForCheck();
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

  updateValidators(useExistingConfiguration: boolean) {
    this.searchConfigurationControl.setValidators(useExistingConfiguration ? [Validators.required] : []);
    this.searchConfigurationControl.updateValueAndValidity();
  }
}
