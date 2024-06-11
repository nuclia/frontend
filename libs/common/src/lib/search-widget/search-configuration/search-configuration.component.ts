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
  OptionModel,
  OptionSeparator,
  OptionType,
  PaDropdownModule,
  PaPopupModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { RouterLink } from '@angular/router';
import { FeaturesService, SDKService, UNAUTHORIZED_ICON } from '@flaps/core';
import { LearningOptionPipe } from '../../pipes';
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
import { takeUntil, tap } from 'rxjs/operators';
import { LearningConfigurations } from '@nuclia/core';
import { SaveConfigModalComponent } from './save-config-modal/save-config-modal.component';

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
    ReactiveFormsModule,
    SearchBoxFormComponent,
    GenerativeAnswerFormComponent,
    ResultsDisplayFormComponent,
    RouterLink,
    TranslateModule,
  ],
  providers: [LearningOptionPipe],
  templateUrl: './search-configuration.component.html',
  styleUrl: './search-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchConfigurationComponent {
  private cdr = inject(ChangeDetectorRef);
  private sdk = inject(SDKService);
  private featuresService = inject(FeaturesService);
  private translate = inject(TranslateService);
  private learningOption = inject(LearningOptionPipe);
  private modalService = inject(SisModalService);
  private searchWidgetService = inject(SearchWidgetService);
  private toaster = inject(SisToastService);

  private unsubscribeAll = new Subject<void>();

  /* To be defined
 // FIXME which vision model should we use?
  private visionConfigOption: OptionModel = new OptionModel({
    id: 'nuclia-image',
    value: 'image',
    label: this.translate.instant('search.configuration.options.image'),
    help: 'Vision',
  });
  */

  @Input({ transform: booleanAttribute }) displayWidgetButtonLine = false;
  @Input() configurationContainer?: ElementRef;
  @Input() mainTitle = '';

  @Output() configUpdate = new EventEmitter<SearchConfiguration>();

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
  unsupportedModels: string[] = [];
  unauthorizedModels: string[] = [];
  generativeModels: OptionModel[] = [];
  defaultPromptFromSettings = '';

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
            tap(([schema, config]) => {
              this.unsupportedModels = this.featuresService.getUnsupportedGenerativeModels(
                schema,
                config['semantic_model'],
              );
            }),
            switchMap(([schema, config]) =>
              this.featuresService.getUnauthorizedGenerativeModels(schema).pipe(
                tap((unauthorizedModels) => {
                  this.unauthorizedModels = unauthorizedModels;
                }),
                map(
                  () =>
                    ({ schema, config, kbId: kb.id }) as {
                      config: { [id: string]: any };
                      schema: LearningConfigurations;
                      kbId: string;
                    },
                ),
              ),
            ),
          );
        }),
      )
      .subscribe({
        next: ({ kbId, schema, config }) => {
          this.modelFromSettings = config['generative_model'] || '';
          this.setConfigurations(kbId);
          this.setModelsAndPrompt(schema, config);
          this.initialised = true;
          this.cdr.detectChanges();
        },
        error: () => this.toaster.error('search.configuration.loading-error'),
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private setConfigurations(kbId: string) {
    const kbModel = this.learningOption.transform(
      { value: this.modelFromSettings, name: this.modelFromSettings },
      'generative_model',
    );
    const standardConfigOption = new OptionModel({
      id: 'nuclia-standard',
      value: 'nuclia-standard',
      label: this.translate.instant('search.configuration.options.nuclia-standard'),
      help: kbModel,
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
            help:
              this.learningOption.transform(
                {
                  value: item.generativeAnswer.generativeModel,
                  name: item.generativeAnswer.generativeModel,
                },
                'generative_model',
              ) || kbModel,
          }),
      ),
    );

    const savedConfig = this.searchWidgetService.getSelectedSearchConfig(kbId);
    if (savedConfig.id === 'nuclia-standard') {
      savedConfig.generativeAnswer = { ...savedConfig.generativeAnswer, generativeModel: this.modelFromSettings };
    }
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
          label: this.learningOption.transform(model, 'generative_model'),
          disabled: this.unsupportedModels.includes(model.value) || this.unauthorizedModels.includes(model.value),
          iconModel: this.unauthorizedModels.includes(model.value) ? UNAUTHORIZED_ICON : undefined,
          iconOnRight: true,
          help:
            this.modelFromSettings === model.value
              ? this.translate.instant('search.configuration.generative-answer.generative-model.kb-settings')
              : null,
        }),
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

  private updateWidget() {
    if (this.currentConfig) {
      this.configUpdate.emit(this.currentConfig);
      this.searchWidgetService.generateWidgetSnippet(this.currentConfig).subscribe();
    }
  }
}
