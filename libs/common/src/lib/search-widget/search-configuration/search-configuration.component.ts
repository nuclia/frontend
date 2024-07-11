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
import { CommonModule } from '@angular/common';
import { ButtonMiniComponent, InfoCardComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { GenerativeAnswerFormComponent } from './generative-answer-form';
import { ResultsDisplayFormComponent } from './results-display-form';
import { SearchBoxFormComponent } from './search-box-form';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { SearchWidgetService } from '../search-widget.service';
import { filter, forkJoin, map, Subject, switchMap, take } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  GenerativeAnswerConfig,
  isSameConfigurations,
  ResultDisplayConfig,
  SearchBoxConfig,
  SearchConfiguration,
} from '../search-widget.models';
import { takeUntil } from 'rxjs/operators';
import { LearningConfigurations } from '@nuclia/core';
import { SaveConfigModalComponent } from './save-config-modal/save-config-modal.component';
import { SearchRequestModalComponent } from './search-request-modal';

@Component({
  selector: 'stf-search-configuration',
  standalone: true,
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

  private unsubscribeAll = new Subject<void>();

  @Input({ transform: booleanAttribute }) displayWidgetButtonLine = false;
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

  configurations: OptionType[] = [];

  selectedConfig = new FormControl<string>('');

  savedConfig?: SearchConfiguration;
  currentConfig?: SearchConfiguration;

  modelFromSettings = '';
  modelNames: { [key: string]: string } = {};
  generativeModels: OptionModel[] = [];
  promptInfos: { [model: string]: string } = {};
  defaultPromptFromSettings = '';
  lastQuery?: { [key: string]: any };

  initialised = false;

  isConfigModified = false;

  get isNucliaConfig() {
    return this.selectedConfig.value?.startsWith('nuclia-');
  }

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap((kb) => {
          return forkJoin([kb.getLearningSchema(), kb.getConfiguration()]).pipe(
            map(
              ([schema, config]) =>
                ({ schema, config, kbId: kb.id }) as {
                  config: { [id: string]: any };
                  schema: LearningConfigurations;
                  kbId: string;
                },
            ),
          );
        }),
      )
      .subscribe({
        next: ({ kbId, schema, config }) => {
          this.modelFromSettings = config['generative_model'] || '';
          this.modelNames =
            schema['generative_model']?.options?.reduce(
              (acc, model) => {
                acc[model.value] = model.name;
                return acc;
              },
              {} as { [key: string]: string },
            ) || {};
          this.setConfigurations(kbId);
          this.setModelsAndPrompt(schema, config);
          this.initialised = true;
          this.cdr.detectChanges();
        },
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

  private setConfigurations(kbId: string) {
    const standardConfigOption = new OptionModel({
      id: 'nuclia-standard',
      value: 'nuclia-standard',
      label: this.translate.instant('search.configuration.options.nuclia-standard'),
      help: this.modelNames[this.modelFromSettings] || this.modelFromSettings,
    });

    const savedConfigs = this.searchWidgetService.getSavedSearchConfigs(kbId);
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
            help: this.modelNames[item.generativeAnswer?.generativeModel] || item.generativeAnswer?.generativeModel,
          }),
      ),
    );

    const savedConfig = this.searchWidgetService.getSelectedSearchConfig(kbId);
    this.savedConfig = savedConfig;
    // config selection must be done in next check detection cycle for selection options to be there
    setTimeout(() => this.selectedConfig.patchValue(savedConfig.id));
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
            this.modelFromSettings === model.value
              ? this.translate.instant('search.configuration.generative-answer.generative-model.kb-settings')
              : null,
        }),
    );
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
    const promptKey = generativeModels.find((model) => model.value === this.modelFromSettings)?.user_prompt;
    this.defaultPromptFromSettings = promptKey ? config['user_prompts']?.[promptKey]?.['prompt'] || '' : '';
  }

  selectConfig(configId: string) {
    this.sdk.currentKb.pipe(take(1)).subscribe((kb) => {
      this.searchWidgetService.saveSelectedSearchConfig(kb.id, configId);
      this.savedConfig = this.searchWidgetService.getSelectedSearchConfig(kb.id);
      this.currentConfig = { ...this.savedConfig };
      this.cdr.markForCheck();
    });
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
    }
  }

  saveConfig() {
    if (this.isConfigModified) {
      this.modalService
        .openModal(SaveConfigModalComponent)
        .onClose.pipe(filter((confirm) => !!confirm))
        .subscribe((configName) => this._saveConfig(configName));
    }
  }

  overwriteConfig() {
    if (this.isConfigModified && this.currentConfig) {
      this._saveConfig(this.currentConfig.id);
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
          switchMap(() => this.sdk.currentKb.pipe(take(1))),
        )
        .subscribe((kb) => {
          this.searchWidgetService.deleteSearchConfig(kb.id, config.id);
          this.setConfigurations(kb.id);
        });
    }
  }

  private _saveConfig(configName: string) {
    if (this.currentConfig) {
      const config = this.currentConfig;
      this.sdk.currentKb.pipe(take(1)).subscribe((kb) => {
        this.searchWidgetService.saveSearchConfig(kb.id, configName, config);
        this.setConfigurations(kb.id);
        this.isConfigModified = false;
      });
    }
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
      this.configUpdate.emit(this.currentConfig);
    }
  }
}
