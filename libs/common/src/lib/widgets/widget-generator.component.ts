import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, SDKService, StateService, STFTrackingService } from '@flaps/core';
import { combineLatest, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { markForCheck, TranslateService } from '@guillotinaweb/pastanaga-angular';
import { debounceTime, filter, shareReplay } from 'rxjs/operators';
import { SisModalService } from '@nuclia/sistema';
import { WidgetHintDialogComponent } from './hint/widget-hint.component';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { NavigationService } from '@flaps/common';

const DEFAULT_WIDGET_CONFIG: {
  features: string[];
  placeholder?: string;
} = {
  features: [],
};
const WIDGETS_CONFIGURATION = 'NUCLIA_WIDGETS_CONFIGURATION';

@Component({
  selector: 'app-widget-generator',
  templateUrl: 'widget-generator.component.html',
  styleUrls: ['./widget-generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGeneratorComponent implements OnInit, OnDestroy {
  private localStorage = inject(LOCAL_STORAGE);

  showWarning = this.sdk.currentKb.pipe(map((kb) => kb.state === 'PRIVATE'));
  showLink = this.sdk.currentKb.pipe(map((kb) => !!kb.admin && kb.state === 'PRIVATE'));
  homeUrl = this.navigation.homeUrl;

  mainForm?: FormGroup;
  validationMessages = {
    title: {
      sluggable: 'stash.widgets.invalid-id',
    },
  };
  placeholder?: string;
  snippet = '';
  snippetPreview: SafeHtml = '';
  unsubscribeAll = new Subject<void>();
  clipboardSupported = !!(navigator.clipboard && navigator.clipboard.writeText);
  copyIcon = 'copy';
  isTrainingEnabled = this.tracking.isFeatureEnabled('training').pipe(shareReplay(1));
  areAnswersEnabled = this.tracking.isFeatureEnabled('answers').pipe(shareReplay(1));
  areSynonymsEnabled = combineLatest([
    this.tracking.isFeatureEnabled('manage-synonyms').pipe(shareReplay(1)),
    this.stateService.account.pipe(
      filter((account) => !!account),
      map((account) => account?.type),
    ),
  ]).pipe(map(([featureEnabled, accountType]) => featureEnabled && accountType === 'stash-business'));

  debouncePlaceholder = new Subject<string>();

  widgetConfigurations: { [kbId: string]: typeof DEFAULT_WIDGET_CONFIG };

  get mainFormFeatures() {
    return this.mainForm?.controls['features'].value || {};
  }

  get features(): string {
    return Object.entries(this.mainFormFeatures).reduce((features, [feature, enabled]) => {
      if (enabled) {
        features = `${features.length > 0 ? features + ',' : ''}${feature}`;
      }
      return features;
    }, '');
  }

  constructor(
    private fb: NonNullableFormBuilder,
    private sanitized: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private backendConfig: BackendConfigurationService,
    private tracking: STFTrackingService,
    private translation: TranslateService,
    private modalService: SisModalService,
    private sdk: SDKService,
    private navigation: NavigationService,
    private stateService: StateService,
  ) {
    const config = this.localStorage.getItem(WIDGETS_CONFIGURATION);
    if (config) {
      try {
        this.widgetConfigurations = JSON.parse(config);
      } catch (error) {
        this.widgetConfigurations = {};
        this.localStorage.setItem(WIDGETS_CONFIGURATION, '{}');
      }
    } else {
      this.widgetConfigurations = {};
    }

    this.preloadAlternativeWidget();
  }

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) => {
          const config = this.widgetConfigurations[kb.id] || DEFAULT_WIDGET_CONFIG;
          this.placeholder = config.placeholder;
          this.mainForm = this.fb.group({
            features: this.fb.group({
              autofilter: [config.features.includes('autofilter')],
              answers: [config.features.includes('answers')],
              filter: [config.features.includes('filter')],
              navigateToFile: [config.features.includes('navigateToFile')],
              navigateToLink: [config.features.includes('navigateToLink')],
              onlyAnswers: [config.features.includes('onlyAnswers')],
              permalink: [config.features.includes('permalink')],
              relations: [config.features.includes('relations')],
              suggestLabels: [config.features.includes('suggestLabels')],
              suggestions: [config.features.includes('suggestions')],
              useSynonyms: [config.features.includes('useSynonyms')],
            }),
          });
          setTimeout(() => this.generateSnippet(), 100);
          return this.mainForm.valueChanges;
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.onFormChange();
        this.mainForm?.markAsDirty();
      });

    this.debouncePlaceholder.pipe(debounceTime(500)).subscribe((placeholder) => {
      this.placeholder = placeholder || undefined;
      this.onFormChange();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.deletePreview();
  }

  deletePreview() {
    const searchWidgetElement = document.querySelector('nuclia-search') as any;
    const searchBarElement = document.querySelector('nuclia-search-bar') as any;
    const searchResultsElement = document.querySelector('nuclia-search-results') as any;
    if (typeof searchWidgetElement?.$destroy === 'function') {
      searchWidgetElement.$destroy();
    }
    if (typeof searchBarElement?.$destroy === 'function') {
      searchBarElement.$destroy();
    }
    if (typeof searchResultsElement?.$destroy === 'function') {
      searchResultsElement.$destroy();
    }
    searchWidgetElement?.remove();
    searchBarElement?.remove();
    searchResultsElement?.remove();
  }

  generateSnippet() {
    this.deletePreview();
    const placeholder = this.hasPlaceholder()
      ? `
  placeholder="${this.placeholder}"`
      : '';

    this.sdk.currentKb.pipe(take(1)).subscribe((kb) => {
      const zone = this.sdk.nuclia.options.standalone ? `standalone="true"` : `zone="${this.sdk.nuclia.options.zone}"`;
      const apiKey = `apikey="YOUR_API_TOKEN"`;
      const privateDetails =
        kb.state === 'PRIVATE'
          ? `
  state="${kb.state}"
  account="${kb.account}"
  kbslug="${kb.slug}"
  ${apiKey}`
          : '';
      const backend = this.sdk.nuclia.options.standalone
        ? `
  backend="${this.backendConfig.getAPIURL()}"`
        : '';
      const baseSnippet = `<nuclia-search-bar
  knowledgebox="${kb.id}"
  ${zone}
  features="${this.features}" ${placeholder}${privateDetails}${backend}></nuclia-search-bar>
<nuclia-search-results></nuclia-search-results>`;

      this.snippet = `<script src="https://cdn.nuclia.cloud/nuclia-video-widget.umd.js"></script>
${baseSnippet}`;
      this.snippetPreview = this.sanitized.bypassSecurityTrustHtml(
        baseSnippet
          .replace(
            'zone=',
            `client="dashboard" backend="${this.backendConfig.getAPIURL()}"
      lang="${this.translation.currentLang}"
      zone=`,
          )
          .replace('standalone=', 'client="dashboard" standalone=')
          .replace(apiKey, ''),
      );
    });

    markForCheck(this.cdr);
  }

  private hasPlaceholder() {
    return !!this.placeholder;
  }

  copy() {
    navigator.clipboard.writeText(this.snippet);
    this.copyIcon = 'check';
    markForCheck(this.cdr);
    setTimeout(() => {
      this.copyIcon = 'copy';
      markForCheck(this.cdr);
    }, 1000);
  }

  onPlaceholderChange(value: string) {
    this.debouncePlaceholder.next(value);
  }

  showHints() {
    this.modalService.openModal(WidgetHintDialogComponent);
  }

  private preloadAlternativeWidget() {
    const id = 'old-widget-script';
    if (!document.querySelector(`#${id}`)) {
      const widgetScript = window.document.createElement('script');
      widgetScript.id = id;
      widgetScript.type = 'text/javascript';
      widgetScript.async = true;
      widgetScript.defer = true;
      widgetScript.src = `${this.backendConfig.getCDN()}/nuclia-widget.umd.js`;
      window.document.body.appendChild(widgetScript);
    }
  }

  onFormChange() {
    this.generateSnippet();
    this.sdk.currentKb.pipe(take(1)).subscribe((kb) => {
      this.widgetConfigurations[kb.id] = {
        features: this.features.split(','),
        placeholder: this.placeholder,
      };
      this.localStorage.setItem(WIDGETS_CONFIGURATION, JSON.stringify(this.widgetConfigurations));
    });
  }
}
