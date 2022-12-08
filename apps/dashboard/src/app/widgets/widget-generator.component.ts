import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, SDKService, STFTrackingService } from '@flaps/core';
import { map, Subject, take, takeUntil } from 'rxjs';
import { markForCheck, TranslateService } from '@guillotinaweb/pastanaga-angular';
import { debounceTime } from 'rxjs/operators';
import { SisModalService } from '@nuclia/sistema';
import { WidgetHintDialogComponent } from './hint/widget-hint.component';
import { AppService } from '../services/app.service';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-widget-generator',
  templateUrl: 'widget-generator.component.html',
  styleUrls: ['./widget-generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGeneratorComponent implements OnInit, OnDestroy {
  showWarning = this.sdk.currentKb.pipe(map((kb) => kb.state === 'PRIVATE'));
  showLink = this.sdk.currentKb.pipe(map((kb) => !!kb.admin && kb.state === 'PRIVATE'));
  homeUrl = this.navigation.homeUrl;

  mainForm = this.fb.group({
    mode: ['embedded'],
    features: this.fb.group({
      editLabels: [false],
      entityAnnotation: [false],
      filter: [false],
      navigateToLink: [false],
      permalink: [false],
      suggestLabels: [false],
      suggestions: [false],
    }),
  });
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

  get widgetMode() {
    return this.mainForm.controls.mode.value;
  }

  get features(): string {
    return Object.entries(this.mainForm.controls.features.value || {}).reduce((features, [feature, enabled]) => {
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
    private appService: AppService,
    private navigation: NavigationService,
  ) {
    this.appService.setSearchEnabled(false);
    this.loadVideoWidget();
  }

  ngOnInit() {
    // Wait for dashboard search widget to be removed before generating the preview
    // FIXME: timeout to be removed once the widget won't be on the topbar anymore
    setTimeout(() => this.generateSnippet(), 100);

    this.mainForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.generateSnippet();
      this.mainForm.markAsDirty();
    });

    this.debouncePlaceholder.pipe(debounceTime(500)).subscribe((placeholder) => {
      this.placeholder = placeholder || undefined;
      this.generateSnippet();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    setTimeout(() => {
      // Wait until the component is destroyed
      this.appService.setSearchEnabled(true);
    }, 100);
  }

  deletePreview() {
    const customElement = document.getElementById('preview')?.getElementsByTagName('nuclia-search')[0];
    customElement?.remove();
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

  private loadVideoWidget() {
    const id = 'video-widget-script';
    if (!document.querySelector(`#${id}`)) {
      const videoScript = window.document.createElement('script');
      videoScript.id = id;
      videoScript.type = 'text/javascript';
      videoScript.async = true;
      videoScript.defer = true;
      videoScript.src = `${this.backendConfig.getCDN()}/nuclia-video-widget.umd.js`;
      window.document.body.appendChild(videoScript);
    }
  }
}
