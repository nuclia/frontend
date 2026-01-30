import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import {
  DropdownComponent,
  PaButtonModule,
  PaDropdownModule,
  PaExpanderModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
  PopupDirective,
  transitionDuration,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  ModelInfo,
  GenerativeProvider,
  GenerativeProviders,
  DataResidencyStatus,
  LearningConfigurations,
} from '@nuclia/core';

@Component({
  selector: 'stf-model-selector',
  imports: [
    CommonModule,
    PaButtonModule,
    PaDropdownModule,
    PaExpanderModule,
    PaIconModule,
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
  onChange: any;
  onTouched: any;

  providers = input<GenerativeProviders>({});
  learningConfigurations = input<LearningConfigurations>({});
  disclaimerExpanded = input<boolean>(false);
  externalLabel = input<boolean>(false);
  heightChanged = output<void>();

  selectedModel = signal<string>('');
  term = signal('');
  filter = signal<string | undefined>(undefined);
  showDisclaimer = signal(false);
  accepted = signal(true);
  disabled = signal(false);
  enterpriseReadyFilter = 'enterprise-ready-filter';

  @ViewChild('popup') popup?: PopupDirective;
  @ViewChild('dropdown') dropdown?: DropdownComponent;

  DataResidencyStatus = DataResidencyStatus;

  allowedProviders = computed(() => {
    const allowedModels = (this.learningConfigurations()['generative_model']?.options || []).map(
      (option) => option.value,
    );
    return Object.entries(this.providers()).map(([providerKey, provider]) => ({
      providerKey,
      provider: {
        ...provider,
        models: Object.fromEntries(
          Object.entries(provider.models).filter(
            ([key, model]) =>
              (providerKey !== 'default' && allowedModels?.includes(key)) ||
              (providerKey === 'default' && allowedModels?.includes(model.name)),
          ),
        ),
      },
    }));
  });

  modelList = computed(() =>
    this.allowedProviders().reduce(
      (acc, { providerKey, provider }) =>
        acc.concat(
          Object.entries(provider.models).map(([modelKey, model]) => ({ providerKey, provider, modelKey, model })),
        ),
      [] as { providerKey: string; provider: GenerativeProvider; modelKey: string; model: ModelInfo }[],
    ),
  );

  selectedModelData = computed(() => {
    const isCustomModel = this.selectedModel()?.includes('/');
    const model = this.selectedModel()
      ? isCustomModel
        ? this.modelList()
            .filter((model) => model.providerKey === 'default')
            .find((model) => model.model.name === this.selectedModel())
        : this.modelList()
            .filter((model) => model.providerKey !== 'default')
            .find((model) => model.modelKey === this.selectedModel())
      : undefined;
    return { title: model?.model.title, description: model?.model.description, provider: model?.provider };
  });

  disclaimerText = computed(() => {
    // TODO: get disclaimer text from "selectedModelData" once the backend returns the disclaimer text
    return '';
  });

  filteredByTerm = computed(() =>
    this.allowedProviders()
      .map(({ providerKey, provider }) => ({
        key: providerKey,
        value: {
          ...provider,
          models: Object.entries(provider.models)
            .filter(([, model]) => model.title.toLocaleLowerCase().includes(this.term().toLowerCase()))
            .map(([key, value]) => ({ key, value })),
        },
      }))
      .filter((provider) => Object.keys(provider.value.models).length > 0),
  );

  filteredByProvider = computed(() => {
    if (this.filter()) {
      if (this.filter() === this.enterpriseReadyFilter) {
        return this.filteredByTerm().filter(({ value }) => !!value.enterprise_readiness);
      } else {
        const provider = this.filteredByTerm().find(({ key }) => key === this.filter());
        return provider ? [provider] : [];
      }
    }
    return this.filteredByTerm();
  });

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
    if (this.showDisclaimer() && !!this.disclaimerText()) {
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
