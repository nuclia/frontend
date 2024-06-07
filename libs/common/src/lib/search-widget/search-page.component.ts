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
  OptionType,
  PaDropdownModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  GenerativeAnswerFormComponent,
  ResultsDisplayFormComponent,
  SearchBoxFormComponent,
} from './search-configuration';
import {
  GenerativeAnswerConfig,
  ResultDisplayConfig,
  SearchBoxConfig,
  SearchConfiguration,
} from './search-widget.models';
import { FeaturesService, SDKService, UNAUTHORIZED_ICON } from '@flaps/core';
import { takeUntil, tap } from 'rxjs/operators';
import { forkJoin, map, Subject, switchMap } from 'rxjs';
import { LearningConfigurations } from '@nuclia/core';
import { LearningOptionPipe } from '../pipes';
import { SearchWidgetService } from './search-widget.service';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'stf-search-page',
  standalone: true,
  imports: [
    CommonModule,
    PaTextFieldModule,
    DropdownButtonComponent,
    PaDropdownModule,
    ReactiveFormsModule,
    AccordionComponent,
    AccordionItemComponent,
    TranslateModule,
    SearchBoxFormComponent,
    AccordionBodyDirective,
    GenerativeAnswerFormComponent,
    ResultsDisplayFormComponent,
  ],
  providers: [LearningOptionPipe],
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
  private learningOption = inject(LearningOptionPipe);
  private searchWidgetService = inject(SearchWidgetService);

  private unsubscribeAll = new Subject<void>();
  private standardConfigOption: OptionModel = new OptionModel({
    id: 'nuclia-standard',
    value: 'standard',
    label: this.translate.instant('search.configuration.options.standard'),
  });

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

  selectedConfig = new FormControl<string>(this.standardConfigOption.value);

  savedConfig: SearchConfiguration = this.searchWidgetService.getStandardSearchConfiguration();
  currentConfig?: SearchConfiguration;

  unsupportedModels: string[] = [];
  unauthorizedModels: string[] = [];
  generativeModels: OptionModel[] = [];
  defaultPromptFromSettings = '';

  snippetPreview: SafeHtml = '';
  currentQuery = '';
  initialised = false;

  ngOnInit() {
    // TODO: set savedConfig depending on selectedConfig
    this.sdk.currentKb
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap((kb) => forkJoin([kb.getLearningSchema(), kb.getConfiguration()])),
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
                ({ schema, config }) as {
                  config: { [id: string]: any };
                  schema: LearningConfigurations;
                },
            ),
          ),
        ),
      )
      .subscribe(({ schema, config }) => {
        const modelFromSettings: string = config['generative_model'] || '';
        this.standardConfigOption.help = this.learningOption.transform(
          { value: modelFromSettings, name: modelFromSettings },
          'generative_model',
        );
        this.configurations = [new OptionModel({ ...this.standardConfigOption })];
        this.savedConfig = {
          ...this.savedConfig,
          generativeAnswer: { ...this.savedConfig.generativeAnswer, generativeModel: modelFromSettings },
        };
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
                modelFromSettings === model.value
                  ? this.translate.instant('search.configuration.generative-answer.generative-model.kb-settings')
                  : null,
            }),
        );
        const promptKey = generativeModels.find((model) => model.value === modelFromSettings)?.user_prompt;
        this.defaultPromptFromSettings = promptKey ? config['user_prompts']?.[promptKey]?.['prompt'] || '' : '';
        this.initialised = true;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateSearchBoxConfig(config: SearchBoxConfig) {
    const currentConfig = this.currentConfig || this.savedConfig;
    this.currentConfig = { ...currentConfig, searchBox: config };
    this.updateWidget();
  }
  updateGenerativeAnswerConfig(config: GenerativeAnswerConfig) {
    const currentConfig = this.currentConfig || this.savedConfig;
    this.currentConfig = { ...currentConfig, generativeAnswer: config };
    this.updateWidget();
  }
  updateResultDisplayConfig(config: ResultDisplayConfig) {
    const currentConfig = this.currentConfig || this.savedConfig;
    this.currentConfig = { ...currentConfig, resultDisplay: config };
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
        }, 500);
      });
    }
  }
}
