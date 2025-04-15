import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FeaturesService, SDKService } from '@flaps/core';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  ModalConfig,
  OptionModel,
  OptionSeparator,
  OptionType,
  PaDropdownModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LearningConfigurations } from '@nuclia/core';
import { ButtonMiniComponent, InfoCardComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { filter, forkJoin, map, of, Subject, switchMap, take, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { removeDeprecatedModels } from '../../ai-models/ai-models.utils';
import {
  GenerativeAnswerConfig,
  isSameConfigurations,
  ResultDisplayConfig,
  SearchBoxConfig,
  SearchConfiguration,
} from '../search-widget.models';
import { SearchWidgetService } from '../search-widget.service';
import { GenerativeAnswerFormComponent } from './generative-answer-form';
import { ResultsDisplayFormComponent } from './results-display-form';
import { SaveConfigModalComponent } from './save-config-modal/save-config-modal.component';
import { SearchBoxFormComponent } from './search-box-form';
import { SearchRequestModalComponent } from './search-request-modal';

const NUCLIA_SEMANTIC_MODELS = ['ENGLISH', 'MULTILINGUAL', 'MULTILINGUAL_ALPHA'];

@Component({
  selector: 'stf-search-configuration',
  imports: [
    CommonModule,
    AccordionComponent,
    AccordionBodyDirective,
    AccordionItemComponent,
    ButtonMiniComponent,
    InfoCardComponent,
    PaDropdownModule,
    PaPopupModule,
    PaTextFieldModule,
    PaTooltipModule,
    ReactiveFormsModule,
    SearchBoxFormComponent,
    GenerativeAnswerFormComponent,
    ResultsDisplayFormComponent,
    RouterLink,
    TranslateModule,
    PaTooltipModule,
  ],
  templateUrl: './search-configuration.component.html',
  styleUrl: './search-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchConfigurationComponent {
  private cdr = inject(ChangeDetectorRef);
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private modalService = inject(SisModalService);
  private searchWidgetService = inject(SearchWidgetService);
  private toaster = inject(SisToastService);
  private features = inject(FeaturesService);

  private unsubscribeAll = new Subject<void>();

  @Input({ transform: booleanAttribute }) displayWidgetButtonLine = false;
  @Input({ transform: booleanAttribute }) onlySupportedConfigs = false;
  @Input() configurationContainer?: ElementRef;
  @Input() mainTitle = '';

  @Output() configUpdate = new EventEmitter<SearchConfiguration>();
  @Output() createWidget = new EventEmitter<void>();

  @ViewChild('searchBox', { read: AccordionItemComponent }) searchBoxItem?: AccordionItemComponent;
  @ViewChild('generativeAnswer', { read: AccordionItemComponent }) generativeAnswerItem?: AccordionItemComponent;
  @ViewChild('results', { read: AccordionItemComponent }) resultsItem?: AccordionItemComponent;

  @HostBinding('class.bigger-gap') get hasWidgetLine() {
    return this.displayWidgetButtonLine;
  }

  isRagLabAuthorized = this.features.authorized.promptLab;
  configurations: OptionType[] = [];

  selectedConfig = new FormControl<string>('');

  savedConfig?: SearchConfiguration;
  currentConfig?: SearchConfiguration;

  generativeModelFromSettings = '';
  semanticModelFromSettings = '';
  generativeModelNames: { [key: string]: string } = {};
  generativeModels: OptionModel[] = [];
  semanticModels: OptionModel[] = [];
  promptInfos: { [model: string]: string } = {};
  defaultPromptFromSettings = '';
  defaultSystemPromptFromSettings = '';
  lastQuery?: { [key: string]: any };

  initialised = false;

  isConfigModified = false;
  isConfigUnsupported = false;
  canModifyConfig = this.features.isKbAdmin;

  get isNucliaConfig() {
    return this.selectedConfig.value?.startsWith('nuclia-');
  }

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => {
          return forkJoin([kb.getLearningSchema(), kb.getConfiguration()]).pipe(
            map(
              ([schema, config]) =>
                ({ schema: removeDeprecatedModels(schema), config }) as {
                  config: { [id: string]: any };
                  schema: LearningConfigurations;
                },
            ),
          );
        }),
        tap(({ schema, config }) => {
          this.generativeModelFromSettings = config['generative_model'] || '';
          this.semanticModelFromSettings = config['default_semantic_model'] || '';
          this.generativeModelNames =
            schema['generative_model']?.options?.reduce(
              (acc, model) => {
                acc[model.value] = model.name;
                return acc;
              },
              {} as { [key: string]: string },
            ) || {};
          this.setModelsAndPrompt(schema, config);
          this.initialised = true;
          this.cdr.detectChanges();
        }),
        switchMap(() => this.setConfigurations()),
      )
      .subscribe({
        error: () => this.toaster.error('search.configuration.loading-error'),
      });
    this.searchWidgetService.logs
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((logs) => !!logs['lastQuery']),
        map((logs) => logs['lastQuery']),
      )
      .subscribe((lastQuery) => {
        this.lastQuery = lastQuery;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private setConfigurations() {
    return forkJoin([
      this.sdk.currentKb.pipe(take(1)),
      this.onlySupportedConfigs
        ? this.searchWidgetService.supportedSearchConfigurations.pipe(take(1))
        : this.searchWidgetService.searchConfigurations.pipe(take(1)),
    ]).pipe(
      tap(([kb, savedConfigs]) => {
        const standardConfigOption = new OptionModel({
          id: 'nuclia-standard',
          value: 'nuclia-standard',
          label: this.translate.instant('search.configuration.options.nuclia-standard'),
          help: this.generativeModelNames[this.generativeModelFromSettings] || this.generativeModelFromSettings,
        });

        const configurations: OptionType[] = [standardConfigOption];
        if (savedConfigs.length > 0) {
          configurations.push(new OptionSeparator());
        }
        this.configurations = configurations.concat(
          savedConfigs.map(
            (item) =>
              new OptionModel({
                id: item.id,
                value: item.id,
                label: item.id,
                help:
                  this.generativeModelNames[item.generativeAnswer?.generativeModel] ||
                  item.generativeAnswer?.generativeModel,
              }),
          ),
        );

        const savedConfig = this.searchWidgetService.getSelectedSearchConfig(kb.id, savedConfigs);
        this.savedConfig = savedConfig;
        // config selection must be done in next check detection cycle for selection options to be there
        setTimeout(() => this.selectedConfig.patchValue(savedConfig.id));
      }),
    );
  }

  private setModelsAndPrompt(schema: LearningConfigurations, config: { [key: string]: any }) {
    const generativeModels = schema['generative_model']?.options || [];
    this.generativeModels = generativeModels.map(
      (model) =>
        new OptionModel({
          id: model.value,
          value: model.value,
          label: model.name,
          help:
            this.generativeModelFromSettings === model.value
              ? this.translate.instant('search.configuration.generative-answer.generative-model.kb-settings')
              : null,
        }),
    );
    const semanticModelsName = (schema['semantic_models'].options || []).reduce(
      (names, model) => {
        names[model.value] = model.name;
        return names;
      },
      {} as { [value: string]: string },
    );
    this.semanticModels = (config['semantic_models'] || []).map((model: string) => {
      const isNucliaModel = NUCLIA_SEMANTIC_MODELS.includes(semanticModelsName[model]);
      const help = isNucliaModel
        ? this.translate.instant('user.kb.creation-form.models.options.' + semanticModelsName[model])
        : model;
      return new OptionModel({
        id: model,
        value: model,
        label: isNucliaModel
          ? `Nuclia ${model}`
          : this.translate.instant('user.kb.creation-form.models.options.' + semanticModelsName[model]),
        help:
          this.semanticModelFromSettings === model
            ? `${help} ${this.translate.instant('search.configuration.generative-answer.generative-model.kb-settings')}`
            : help,
      });
    });
    const promptInfos = Object.entries(schema['user_prompts']?.schemas || {}).reduce(
      (infos, [prompt, schema]) => {
        if (schema.properties['prompt']?.info) {
          infos[prompt] = schema.properties['prompt']?.info;
        }
        return infos;
      },
      {} as { [prompt: string]: string },
    );
    this.promptInfos = generativeModels
      .filter((model) => !!model.user_prompt && model.user_prompt !== 'none')
      .reduce(
        (infoByModel, model) => {
          infoByModel[model.value] = promptInfos[model.user_prompt as string];
          return infoByModel;
        },
        {} as { [model: string]: string },
      );
    const promptKey = generativeModels.find((model) => model.value === this.generativeModelFromSettings)?.user_prompt;
    this.defaultPromptFromSettings = promptKey ? config['user_prompts']?.[promptKey]?.['prompt'] || '' : '';
    this.defaultSystemPromptFromSettings = promptKey ? config['user_prompts']?.[promptKey]?.['system'] || '' : '';
  }

  selectConfig(configId: string) {
    forkJoin([this.searchWidgetService.searchConfigurations.pipe(take(1)), this.sdk.currentKb.pipe(take(1))]).subscribe(
      ([configs, kb]) => {
        this.searchWidgetService.saveSelectedSearchConfig(kb.id, configId);
        this.savedConfig = this.searchWidgetService.getSelectedSearchConfig(kb.id, configs);
        this.currentConfig = { ...this.savedConfig };
        this.isConfigModified = false;
        this.isConfigUnsupported = !!this.savedConfig.unsupported;
        this.updateWidget();
        this.cdr.markForCheck();
      },
    );
  }

  triggerCreateWidget() {
    if (this.isConfigModified) {
      this.modalService.openConfirm({
        title: 'search.configuration.save-changes-modal.title',
        description: 'search.configuration.save-changes-modal.description',
        confirmLabel: 'Ok',
        onlyConfirm: true,
      });
    } else {
      this.createWidget.emit();
    }
  }

  resetConfig() {
    if (this.savedConfig) {
      this.savedConfig = {
        id: this.savedConfig.id,
        searchBox: { ...this.savedConfig.searchBox },
        generativeAnswer: { ...this.savedConfig.generativeAnswer },
        resultDisplay: { ...this.savedConfig.resultDisplay },
      };
      this.isConfigModified = false;
      this.isConfigUnsupported = false;
    }
  }

  saveConfig() {
    if (this.isConfigModified) {
      this.modalService
        .openModal(SaveConfigModalComponent)
        .onClose.pipe(
          filter((confirm) => !!confirm),
          switchMap((configName) => this._saveConfig(configName)),
          switchMap(() => this.setConfigurations()),
        )
        .subscribe();
    }
  }

  overwriteConfig() {
    if (this.isConfigModified && this.currentConfig) {
      this._saveConfig(this.currentConfig.id).subscribe();
    }
  }

  deleteConfig() {
    if (this.savedConfig && !this.savedConfig.id.startsWith('nuclia-')) {
      const config = this.savedConfig;
      this.modalService
        .openConfirm({
          title: this.translate.instant('search.configuration.delete-config-confirm.title', { configName: config.id }),
          description: 'search.configuration.delete-config-confirm.description',
          confirmLabel: 'generic.delete',
          isDestructive: true,
        })
        .onClose.pipe(
          filter((confirm) => !!confirm),
          switchMap(() => this.searchWidgetService.deleteSearchConfig(config.id)),
          switchMap(() => this.setConfigurations()),
        )
        .subscribe();
    }
  }

  private _saveConfig(configName: string) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        this.currentConfig
          ? this.searchWidgetService.saveSearchConfig(kb.id, configName, this.currentConfig)
          : of(undefined),
      ),
      tap(() => {
        this.isConfigModified = false;
      }),
    );
  }

  updateSearchBoxConfig(config: SearchBoxConfig) {
    if (!this.savedConfig) {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, searchBox: config };
    this.isConfigModified = !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.updateWidget();
  }
  updateGenerativeAnswerConfig(config: GenerativeAnswerConfig) {
    if (!this.savedConfig) {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, generativeAnswer: config };
    this.isConfigModified = !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.updateWidget();
  }
  updateResultDisplayConfig(config: ResultDisplayConfig) {
    if (!this.savedConfig) {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, resultDisplay: config };
    this.isConfigModified = !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.updateWidget();
  }

  updateSearchBoxHeight() {
    this.searchBoxItem?.updateContentHeight();
  }
  updateGenerativeAnswerHeight() {
    this.generativeAnswerItem?.updateContentHeight();
  }
  updateResultsHeight() {
    this.resultsItem?.updateContentHeight();
  }

  scrollOnTop() {
    this.configurationContainer?.nativeElement.scrollTo(0, { scrollingBehaviour: 'smooth' });
  }

  showLastRequest() {
    if (this.lastQuery) {
      this.modalService.openModal(
        SearchRequestModalComponent,
        new ModalConfig({ dismissable: true, data: this.lastQuery }),
      );
    }
  }

  private updateWidget() {
    if (this.currentConfig) {
      this.lastQuery = undefined;
      this.configUpdate.emit(this.currentConfig);
    }
  }
}
