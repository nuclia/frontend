import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import {
  DropdownComponent,
  PaButtonModule,
  PaDropdownModule,
  PaExpanderModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
  PopupDirective,
  transitionDuration,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { type LearningConfigurationOption } from '@nuclia/core';

const providersNames: { [provider: string]: string } = {
  microsoft: 'Azure OpenAI',
  openai: 'OpenAI',
  claude3: 'Anthropic',
  google: 'Google',
  mistral: 'Mistral',
  huggingface: 'Hugging Face',
  vertex: 'Vertex',
  openai_compat: 'OpenAI compatibility',
  none: 'No generation',
  azure_aii: 'Azure AI',
};

@Component({
  selector: 'stf-model-selector',
  imports: [
    CommonModule,
    PaButtonModule,
    PaDropdownModule,
    PaExpanderModule,
    PaPopupModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaTooltipModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './model-selector.component.html',
  styleUrls: ['./model-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ModelSelectorComponent,
      multi: true,
    },
  ],
})
export class ModelSelectorComponent implements ControlValueAccessor {
  providerNames = providersNames;
  onChange: any;
  onTouched: any;

  options = input<LearningConfigurationOption[]>([]);
  disclaimerRequired = input<boolean>(true);
  disclaimerExpanded = input<boolean>(false);
  heightChanged = output<void>();

  selectedModel = signal<string>('');
  term = signal('');
  filter = signal<string | undefined>(undefined);
  showDisclaimer = signal(false);
  accepted = signal(true);
  disabled = signal(false);

  @ViewChild('popup') popup?: PopupDirective;
  @ViewChild('dropdown') dropdown?: DropdownComponent;

  selectedOption = computed(() =>
    this.selectedModel() ? this.options().find((option) => option.value === this.selectedModel()) : undefined,
  );

  filteredByTerm = computed(() =>
    this.options().filter((option) => option.name.toLowerCase().includes(this.term().toLowerCase())),
  );

  providers = computed(() =>
    this.filteredByTerm().reduce((acc, curr) => {
      if (curr.provider && !acc.includes(curr.provider)) {
        acc.push(curr.provider);
      }
      return acc;
    }, [] as string[]),
  );

  filteredByProvider = computed(() =>
    this.filteredByTerm().filter((option) => !this.filter() || this.filter() === (option.provider || '')),
  );

  optionsGroups = computed(() =>
    Object.entries(
      this.filteredByProvider().reduce(
        (acc, curr) => {
          if (curr.provider) {
            acc[curr.provider] = acc[curr.provider] ? acc[curr.provider].concat(curr) : [curr];
          }
          return acc;
        },
        {} as { [provider: string]: LearningConfigurationOption[] },
      ),
    ),
  );

  writeValue(value: any) {
    this.selectedModel.set(value || '');
  }
  registerOnChange(fn: any) {
    this.onChange = fn;
  }
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }
  setDisabledState?(value: boolean) {
    this.disabled.set(value);
  }

  selectOption(value: string) {
    this.selectedModel.set(value);
    this.term.set('');
    if (value) {
      this.showDisclaimer.set(true);
    }
    this.updateControl();

    setTimeout(() => {
      this.heightChanged.emit();
    }, transitionDuration + 50);
  }

  updateAccepted(value: boolean) {
    this.accepted.set(value);
    this.updateControl();
  }

  updateControl() {
    if (this.disclaimerRequired()) {
      const value = this.selectedModel() && this.accepted() ? this.selectedModel() : '';
      this.onChange(value);
    } else {
      const value = this.selectedModel();
      this.onChange(value);
    }
    this.onTouched();
  }

  openDropdown() {
    if (this.dropdown && !this.dropdown?.isDisplayed) {
      this.popup?.toggle();
    }
  }

  updateTerm(term: string) {
    this.term.set(term);
    this.filter.set(undefined);
  }

  toggleFilter(provider: string) {
    this.filter.update((filter) => (filter === provider ? undefined : provider));
  }
}
