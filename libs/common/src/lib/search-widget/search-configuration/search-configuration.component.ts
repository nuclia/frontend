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
  Pipe,
  PipeTransform,
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
import { LearningConfigurations, GenerativeProviders, SearchConfig, Widget } from '@nuclia/core';
import {
  ButtonMiniComponent,
  ExpandableTextareaComponent,
  InfoCardComponent,
  SisModalService,
  SisToastService,
} from '@nuclia/sistema';
import { filter, forkJoin, map, of, Subject, switchMap, take, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaTogglesModule } from '../../../../../pastanaga-angular/projects/pastanaga-angular/src/lib/controls/toggles/toggles.module';
import { removeDeprecatedModels } from '../../ai-models/ai-models.utils';
import { getChatOptions, getFindOptions, isSameConfigurations } from '../search-widget.models';
import { SearchWidgetService } from '../search-widget.service';
import { GenerativeAnswerFormComponent } from './generative-answer-form';
import { ResultsDisplayFormComponent } from './results-display-form';
import { SaveConfigModalComponent } from './save-config-modal/save-config-modal.component';
import { SearchBoxFormComponent } from './search-box-form';
import { SearchRequestModalComponent } from './search-request-modal';
import { RoutingFormComponent } from './routing-form/routing-form.component';

const NUCLIA_SEMANTIC_MODELS = ['ENGLISH', 'MULTILINGUAL', 'MULTILINGUAL_ALPHA'];

@Pipe({ name: 'isTypedConfig' })
export class IsTypedConfigPipe implements PipeTransform {
  transform(value?: Widget.AnySearchConfiguration): value is Widget.TypedSearchConfiguration {
    return value?.type === 'config';
  }
}

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
    RoutingFormComponent,
    RouterLink,
    TranslateModule,
    PaTooltipModule,
    PaTogglesModule,
    IsTypedConfigPipe,
    ExpandableTextareaComponent,
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
  @Input() bottomSectionStyle = '';

  @Output() configUpdate = new EventEmitter<Widget.AnySearchConfiguration>();
  @Output() createWidget = new EventEmitter<void>();

  @ViewChild('searchBox', { read: AccordionItemComponent }) searchBoxItem?: AccordionItemComponent;
  @ViewChild('generativeAnswer', { read: AccordionItemComponent }) generativeAnswerItem?: AccordionItemComponent;
  @ViewChild('results', { read: AccordionItemComponent }) resultsItem?: AccordionItemComponent;
  @ViewChild('routing', { read: AccordionItemComponent }) routingItem?: AccordionItemComponent;

  @HostBinding('class.bigger-gap') get hasWidgetLine() {
    return this.displayWidgetButtonLine;
  }

  isRagLabAuthorized = this.features.authorized.promptLab;
  isRoutingEnabled = this.features.unstable.routing;
  configurations: OptionType[] = [];

  selectedConfig = new FormControl<string>('');

  savedConfig?: Widget.AnySearchConfiguration;
  currentConfig?: Widget.AnySearchConfiguration;
  originalJsonConfig?: string;
  currentJsonConfig?: string;
  useGenerativeAnswer = false;

  generativeModelFromSettings = '';
  semanticModelFromSettings = '';
  generativeModelNames: { [key: string]: string } = {};
  generativeProviders: GenerativeProviders = {};
  semanticModels: OptionModel[] = [];
  promptInfos: { [model: string]: string } = {};
  defaultPromptFromSettings = '';
  defaultSystemPromptFromSettings = '';
  lastQuery?: { [key: string]: any };

  initialised = false;

  isConfigModified = false;
  isConfigUnsupported = false;
  canModifyConfig = this.features.isKbAdmin;
  ignoreChanges = false;
  ignoreNextRoutingRefresh = false;

  get isNucliaConfig() {
    return this.selectedConfig.value?.startsWith('nuclia-');
  }

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => {
          return forkJoin([kb.getLearningSchema(), kb.getConfiguration(), kb.getGenerativeProviders()]).pipe(
            map(
              ([schema, config, providers]) =>
                ({ schema: removeDeprecatedModels(schema), config, providers }) as {
                  config: { [id: string]: any };
                  schema: LearningConfigurations;
                  providers: GenerativeProviders;
                },
            ),
          );
        }),
        tap(({ schema, config, providers }) => {
          this.generativeModelFromSettings = config['generative_model'] || '';
          this.semanticModelFromSettings = config['default_semantic_model'] || '';
          this.generativeProviders = providers;
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
                  item.type === 'config'
                    ? this.generativeModelNames[item.generativeAnswer?.generativeModel] ||
                      item.generativeAnswer?.generativeModel
                    : undefined,
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
        if (this.savedConfig.type === 'api') {
          this.isConfigUnsupported = true;
          this.originalJsonConfig = JSON.stringify(this.savedConfig.value.config, null, 2);
          this.useGenerativeAnswer = this.savedConfig.value.kind === 'ask';
        } else {
          this.isConfigUnsupported = false;
          this.originalJsonConfig = '';
        }
        this.currentJsonConfig = this.originalJsonConfig;
        this.updateWidget();
        this.cdr.markForCheck();
        // after selecting a config, all the forms trigger a value change, and as old config might not be aligned
        // with the latest supported properties, it may display a warning message to the user saying the config has changed
        // so for 200ms we just ignore any changes
        this.ignoreChanges = true;
        this.ignoreNextRoutingRefresh = true;
        setTimeout(() => (this.ignoreChanges = false), 200);
        setTimeout(() => (this.ignoreNextRoutingRefresh = false), 1000);
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
      if (this.savedConfig.type === 'config') {
        this.savedConfig = {
          type: 'config',
          id: this.savedConfig.id,
          searchBox: { ...this.savedConfig.searchBox },
          generativeAnswer: { ...this.savedConfig.generativeAnswer },
          resultDisplay: { ...this.savedConfig.resultDisplay },
          routing: { ...this.savedConfig.routing },
        };
      } else {
        this.currentJsonConfig = this.originalJsonConfig;
        this.useGenerativeAnswer = this.savedConfig.value.kind === 'ask';
      }
      this.isConfigModified = false;
    }
  }

  saveConfig() {
    if (this.isConfigModified) {
      this.modalService
        .openModal(SaveConfigModalComponent)
        .onClose.pipe(
          filter((confirm) => !!confirm),
          switchMap((configName) => this._saveConfig(configName)),
          filter((success) => !!success),
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
    if (this.isConfigUnsupported && this.currentConfig?.type === 'api') {
      try {
        this.currentConfig.value = {
          kind: this.useGenerativeAnswer ? 'ask' : 'find',
          config: JSON.parse(this.currentJsonConfig || ''),
        };
      } catch (e) {
        this.toaster.error('search.configuration.json-config-error');
        return of(false);
      }
    }
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        this.currentConfig
          ? this.searchWidgetService.saveSearchConfig(kb.id, configName, this.currentConfig).pipe(
              map(() => {
                if (this.isConfigUnsupported) {
                  this.updateWidget();
                }
                this.isConfigModified = false;
                this.originalJsonConfig =
                  this.currentConfig?.type === 'api' ? JSON.stringify(this.currentConfig.value, null, 2) : '';
                return true;
              }),
            )
          : of(false),
      ),
    );
  }

  updateSearchBoxConfig(config: Widget.SearchBoxConfig) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, searchBox: config };
    this.isConfigModified = !this.ignoreChanges && !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.updateWidget();
  }
  updateGenerativeAnswerConfig(config: Widget.GenerativeAnswerConfig) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, generativeAnswer: config };
    this.isConfigModified = !this.ignoreChanges && !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.useGenerativeAnswer = config.generateAnswer;
    this.updateWidget();
  }
  updateResultDisplayConfig(config: Widget.ResultDisplayConfig) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, resultDisplay: config };
    this.isConfigModified = !this.ignoreChanges && !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.updateWidget();
  }
  updateRoutingConfig(config: Widget.RoutingConfig) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, routing: config };
    this.isConfigModified =
      !this.ignoreNextRoutingRefresh && !isSameConfigurations(this.currentConfig, this.savedConfig);
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
  updateRoutingHeight() {
    this.routingItem?.updateContentHeight();
  }

  updateHeight() {
    this.updateSearchBoxHeight();
    this.updateGenerativeAnswerHeight();
    this.updateResultsHeight();
    this.updateRoutingHeight();
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

  updateJsonConfig(jsonConfig: string) {
    this.currentJsonConfig = jsonConfig;
    this.isConfigModified = this.currentConfig !== this.originalJsonConfig;
  }

  switchToJsonMode() {
    this.modalService
      .openConfirm({
        title: this.translate.instant('search.configuration.action.switch-mode-confirm'),
        isDestructive: true,
      })
      .onClose.pipe(filter((confirm) => !!confirm))
      .subscribe(() => {
        if (this.currentConfig?.type === 'config') {
          const isAsk = !!this.currentConfig.generativeAnswer.generateAnswer;
          try {
            const config: SearchConfig = isAsk
              ? {
                  kind: 'ask',
                  config: getChatOptions(this.currentConfig),
                }
              : {
                  kind: 'find',
                  config: getFindOptions(this.currentConfig),
                };
            this.currentConfig = {
              type: 'api',
              id: this.currentConfig.id,
              value: config,
            };
            this.currentJsonConfig = JSON.stringify(config.config, null, 2);
            this.useGenerativeAnswer = isAsk;
            this.isConfigUnsupported = true;
          } catch (e) {
            this.toaster.error('search.configuration.action.switch-mode-error');
          }
        }
        this.cdr.markForCheck();
      });
  }

  updateGenerativeAnswer(useGenerativeAnswer: boolean) {
    this.useGenerativeAnswer = useGenerativeAnswer;
    console.log(this.useGenerativeAnswer);
    if (this.currentConfig?.type === 'api') {
      this.currentConfig.value.kind = useGenerativeAnswer ? 'ask' : 'find';
    }
    this.isConfigModified = true;
    this.cdr.markForCheck();
  }
}
