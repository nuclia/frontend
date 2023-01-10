import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, SDKService, STFTrackingService } from '@flaps/core';
import { map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { markForCheck, TranslateService } from '@guillotinaweb/pastanaga-angular';
import { debounceTime } from 'rxjs/operators';
import { SisModalService } from '@nuclia/sistema';
import { WidgetHintDialogComponent } from './hint/widget-hint.component';
import { NavigationService } from '../services/navigation.service';
import { LOCAL_STORAGE } from '@ng-web-apis/common';

const DEFAULT_WIDGET_CONFIG: {
  mode: 'video' | 'embedded' | 'popup';
  features: string[];
  placeholder?: string;
} = {
  mode: 'video',
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
  isTrainingEnabled = this.tracking.isFeatureEnabled('training');

  debouncePlaceholder = new Subject<string>();

  widgetConfigurations: { [kbId: string]: typeof DEFAULT_WIDGET_CONFIG };

  get mainFormFeatures() {
    return this.mainForm?.controls.features.value || {};
  }

  get widgetMode() {
    return this.mainForm?.controls.mode.value || DEFAULT_WIDGET_CONFIG.mode;
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
            mode: [config.mode],
            features: this.fb.group({
              editLabels: [config.features.includes('editLabels')],
              entityAnnotation: [config.features.includes('entityAnnotation')],
              filter: [config.features.includes('filter')],
              navigateToLink: [config.features.includes('navigateToLink')],
              permalink: [config.features.includes('permalink')],
              suggestLabels: [config.features.includes('suggestLabels')],
              suggestions: [config.features.includes('suggestions')],
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
    const cdn = this.backendConfig.getCDN() || '';
    const mode = this.widgetMode || '';

    const placeholder = this.hasPlaceholder() ? `placeholder="${this.placeholder}"` : '';

    this.sdk.currentKb.pipe(take(1)).subscribe((kb) => {
      const zone = this.sdk.nuclia.options.zone;
      this.snippet =
        mode !== 'video'
          ? `<script src="${cdn}/nuclia-widget.umd.js"></script>
<nuclia-search
  knowledgebox="${kb.id}"
  zone="${zone}"
  type="${mode}"
  features="${this.features}" ${placeholder}
></nuclia-search>`
          : `<script src="${cdn}/nuclia-video-widget.umd.js"></script>
<nuclia-search-bar
  knowledgebox="${kb.id}"
  zone="${zone}"
  features="${this.features}"
  ${placeholder}
></nuclia-search-bar>
<nuclia-search-results></nuclia-search-results>`;

      this.snippetPreview = this.sanitized.bypassSecurityTrustHtml(
        this.snippet.replace(
          'zone=',
          `client="dashboard" backend="${this.backendConfig.getAPIURL()}"
      lang="${this.translation.currentLang}"
      state="${kb.state}" notpublic zone=`,
        ),
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
        mode: this.widgetMode,
        features: this.features.split(','),
        placeholder: this.placeholder,
      };
      this.localStorage.setItem(WIDGETS_CONFIGURATION, JSON.stringify(this.widgetConfigurations));
    });
  }
}
