import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ButtonMiniComponent, InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  GenerativeAnswerFormComponent,
  ResultsDisplayFormComponent,
  SearchBoxFormComponent,
} from './search-configuration';
import {
  GenerativeAnswerConfig,
  isSameConfigurations,
  ResultDisplayConfig,
  SearchBoxConfig,
  SearchConfiguration,
} from './search-widget.models';
import { FeaturesService, SDKService } from '@flaps/core';
import { takeUntil, tap } from 'rxjs/operators';
import { filter, forkJoin, map, Subject, switchMap, take } from 'rxjs';
import { LearningConfigurations } from '@nuclia/core';
import { SearchWidgetService } from './search-widget.service';
import { SafeHtml } from '@angular/platform-browser';
import { SaveConfigModalComponent } from './search-configuration/save-config-modal/save-config-modal.component';
import { RouterLink } from '@angular/router';
import { ResourceViewerService } from '../resources';

@Component({
  selector: 'stf-search-page',
  standalone: true,
  imports: [
    CommonModule,
    AccordionComponent,
    AccordionBodyDirective,
    AccordionItemComponent,
    ButtonMiniComponent,
    PaDropdownModule,
    PaPopupModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslateModule,
    SearchBoxFormComponent,
    GenerativeAnswerFormComponent,
    ResultsDisplayFormComponent,
    RouterLink,
    InfoCardComponent,
  ],
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss', './_common-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SearchPageComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private sdk = inject(SDKService);
  private featuresService = inject(FeaturesService);
  private translate = inject(TranslateService);
  private modalService = inject(SisModalService);
  private searchWidgetService = inject(SearchWidgetService);
  private viewerService = inject(ResourceViewerService);

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

  @ViewChild('configurationContainer') configurationContainer?: ElementRef;
  @ViewChild('searchBox', { read: AccordionItemComponent }) searchBoxItem?: AccordionItemComponent;
  @ViewChild('generativeAnswer', { read: AccordionItemComponent }) generativeAnswerItem?: AccordionItemComponent;
  @ViewChild('results', { read: AccordionItemComponent }) resultsItem?: AccordionItemComponent;

  configurations: OptionType[] = [];

  selectedConfig = new FormControl<string>('');

  savedConfig?: SearchConfiguration;
  currentConfig?: SearchConfiguration;

  modelFromSettings = '';
  modelNames: { [key: string]: string } = {};
  generativeModels: OptionModel[] = [];
  defaultPromptFromSettings = '';

  snippetPreview: SafeHtml = '';
  currentQuery = '';
  initialised = false;

  isConfigModified = false;

  get isNucliaConfig() {
    return this.selectedConfig.value?.startsWith('nuclia-');
  }

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap((kb) =>
          forkJoin([kb.getLearningSchema(), kb.getConfiguration()]).pipe(
            map(
              ([schema, config]) =>
                ({ schema, config, kbId: kb.id }) as {
                  config: { [id: string]: any };
                  schema: LearningConfigurations;
                  kbId: string;
                },
            ),
          ),
        ),
      )
      .subscribe(({ kbId, schema, config }) => {
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
      label: this.translate.instant('search.configuration.options.standard'),
      help: this.modelNames[this.modelFromSettings] || this.modelFromSettings,
    });

    const savedConfigs = this.searchWidgetService.getSavedConfigs(kbId);
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

    const savedConfig = this.searchWidgetService.getSelectedConfig(kbId);
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
          label: model.name,
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
      this.searchWidgetService.saveSelectedConfig(kb.id, configId);
      this.savedConfig = this.searchWidgetService.getSelectedConfig(kb.id);
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
          this.searchWidgetService.deleteConfig(kb.id, config.id);
          this.setConfigurations(kb.id);
        });
    }
  }

  private _saveConfig(configName: string) {
    if (this.currentConfig) {
      const config = this.currentConfig;
      this.sdk.currentKb.pipe(take(1)).subscribe((kb) => {
        this.searchWidgetService.saveConfig(kb.id, configName, config);
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
      this.searchWidgetService.generateSnippet(this.currentConfig).subscribe(({ snippet, preview }) => {
        this.snippetPreview = preview;
        this.cdr.detectChanges();

        // Run the search with the current query if any
        setTimeout(() => {
          const searchWidget = document.getElementsByTagName('nuclia-search-bar')[0] as unknown as any;
          if (this.currentQuery) {
            searchWidget?.search(this.currentQuery);
          }
          searchWidget?.addEventListener('search', (event: { detail: string }) => {
            this.currentQuery = event.detail;
          });
          searchWidget?.addEventListener('resetQuery', () => {
            this.currentQuery = '';
          });
          this.viewerService.init('nuclia-search-results');
        }, 500);
      });
    }
  }
}
