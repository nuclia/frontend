import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendConfigurationService, STFTrackingService } from '@flaps/core';
import { Widget } from '@nuclia/core';
import { filter, map, skip, Subject, switchMap, takeUntil } from 'rxjs';
import { AddWidgetDialogComponent } from '../add/add-widget.component';
import { DEFAULT_FEATURES, DEFAULT_FEATURES_LIST, WidgetService } from '../widget.service';
import { markForCheck, TranslateService } from '@guillotinaweb/pastanaga-angular';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-edit-widget',
  templateUrl: 'edit-widget.component.html',
  styleUrls: ['./edit-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditWidgetComponent implements OnInit, OnDestroy {
  styleForm = this.fb.group({
    'color-primary-regular': [''],
    'color-light-stronger': [''],
    'color-dark-stronger': [''],
    'color-neutral-strong': [''],
    'color-backdrop': [''],
    'font-size-base': [''],
    'font-weight-body': [''],
    'font-weight-semi-bold': [''],
    'border-radius,': [''],
    'z-index-modal': [''],
    'z-index-modal-backdrop': [''],
  });
  styleFormFields = Object.keys(this.styleForm.controls);
  mainForm = this.fb.group({
    mode: ['input'],
    features: this.fb.group({
      suggestLabels: [false],
      editLabels: [false],
      entityAnnotation: [false],
    }),
    attributes: this.fb.group({
      permalink: [false],
      navigateToLink: [false],
    }),
    style: this.styleForm,
  });
  validationMessages = {
    title: {
      sluggable: 'stash.widgets.invalid-id',
    },
  };
  placeholder?: string;
  snippet = '';
  snippetPreview: SafeHtml = '';
  currentTab = 'pref';
  kbId = '';
  kbState = '';
  zone = '';
  unsubscribeAll = new Subject<void>();
  widget?: Widget;
  isDefaultWidget = false;
  clipboardSupported = !!(navigator.clipboard && navigator.clipboard.writeText);
  copyIcon = 'copy';
  isTrainingEnabled = this.tracking.isFeatureEnabled('training');

  debouncePlaceholder = new Subject<string>();

  get widgetMode() {
    return this.mainForm.controls.mode.value;
  }

  constructor(
    private fb: NonNullableFormBuilder,
    private sanitized: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private widgetService: WidgetService,
    private dialog: MatDialog,
    private backendConfig: BackendConfigurationService,
    private tracking: STFTrackingService,
    private translation: TranslateService,
  ) {}

  ngOnInit() {
    this.mainForm.valueChanges.pipe(skip(1), takeUntil(this.unsubscribeAll)).subscribe(() => {
      // FIX: re-rendering the widget triggers a loading of the widget params from backend,
      // so it reinitializes the widget with the currently saved params, hence the local changes are not reflected.
      this.generateSnippet();
      this.mainForm.markAsDirty();
    });
    this.route.params
      .pipe(
        filter((params) => !!params.id),
        switchMap((params) => this.widgetService.getWidgetInfo(params.id)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(({ widget, kbId, kbState, zone }) => {
        this.kbId = kbId;
        this.kbState = kbState || '';
        this.zone = zone;
        this.widget = widget;
        this.isDefaultWidget = widget.id === 'dashboard';
        const emptyFeatures = Object.keys(widget.features).length === 0;
        if (emptyFeatures && this.isDefaultWidget) {
          this.widget.features = DEFAULT_FEATURES;
        }
        this.mainForm.reset();
        this.mainForm.patchValue(this.widget);
        this.generateSnippet();
      });

    this.debouncePlaceholder.pipe(debounceTime(500)).subscribe((placeholder) => {
      this.placeholder = placeholder || undefined;
      this.generateSnippet();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  deletePreview() {
    const customElement = document.getElementById('preview')?.getElementsByTagName('nuclia-search')[0];
    customElement?.remove();
  }

  save() {
    if (this.widget) {
      this.trackChanges();
      const { attributes, ...mainForm } = this.mainForm.getRawValue();
      const widget = {
        ...this.widget,
        ...(mainForm as Partial<Widget>),
      };
      // Backend doesn't support video widget mode
      if (this.widgetMode === 'video') {
        widget.mode = 'input';
      }
      if (this.hasPlaceholder()) {
        widget.placeholder = this.placeholder;
      }
      this.widgetService.saveWidget(this.widget.id, widget).subscribe();
    }
  }

  generateSnippet() {
    if (!this.widget) {
      return;
    }
    this.deletePreview();
    const cdn = this.backendConfig.getCDN() || '';
    const mode = this.widgetMode || '';
    let attributes = Object.entries(this.mainForm.value.attributes || {})
      .filter(([, value]) => !!value)
      .map(([key]) => `\n  ${key}="true"`)
      .join('');
    const defaultFeatures = this.isDefaultWidget ? `\n  defaultfeatures="${DEFAULT_FEATURES_LIST}"` : '';
    const placeholder = this.hasPlaceholder()
      ? `
  placeholder="${this.placeholder}"`
      : '';
    this.snippet =
      mode !== 'video'
        ? `<script src="${cdn}/nuclia-widget.umd.js"></script>
<nuclia-search
  knowledgebox="${this.kbId}"
  zone="${this.zone}"
  widgetid="${this.widget.id}"
  type="${mode}" ${attributes} ${placeholder} ${defaultFeatures}
></nuclia-search>`
        : `<script src="${cdn}/nuclia-video-widget.umd.js"></script>
<nuclia-search-bar
  knowledgebox="${this.kbId}"
  zone="${this.zone}"
  widgetid="${this.widget.id}" ${placeholder}
></nuclia-search-bar>
<nuclia-search-results></nuclia-search-results>`;
    const styles = Object.entries(this.styleForm.value)
      .filter(([, value]) => !!value)
      .map(([key, value]) => `    --custom-${key}: ${value} !important;`);
    const styleStr =
      styles.length === 0
        ? ''
        : `<style>
  nuclia-search {
${styles.join('\n')}
  }
</style>`;
    this.snippetPreview = this.sanitized.bypassSecurityTrustHtml(
      this.snippet.replace(
        'zone=',
        `client="dashboard" backend="${this.backendConfig.getAPIURL()}"
      lang="${this.translation.currentLang}"
      state="${this.kbState}" notpublic zone=`,
      ) + styleStr,
    );
    markForCheck(this.cdr);
  }

  private hasPlaceholder() {
    return !!this.placeholder;
  }

  deleteWidget() {
    if (this.widget) {
      this.widgetService.deleteWidget(this.widget.id).subscribe(() => {
        this.widgetService.updateWidgets();
        this.router.navigate(['..'], { relativeTo: this.route });
      });
    }
  }

  cancel() {
    this.mainForm.reset({ ...this.widget });
    this.generateSnippet();
  }

  rename() {
    const widget = this.widget;
    if (widget) {
      const oldId = widget.id;
      this.dialog
        .open(AddWidgetDialogComponent, { width: '530px', data: { rename: true } })
        .afterClosed()
        .pipe(
          filter((result) => !!result && !!result.id),
          switchMap((result) => this.widgetService.deleteWidget(oldId).pipe(map(() => result))),
          switchMap((result) =>
            this.widgetService.saveWidget(result.id, { ...widget, id: result.id as string }).pipe(map(() => result.id)),
          ),
        )
        .subscribe((id) => {
          this.widgetService.updateWidgets();
          this.router.navigate([`../${id}`], { relativeTo: this.route });
        });
    }
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

  private trackChanges() {
    if (this.mainForm.value.mode !== this.widget?.mode) {
      this.tracking.logEvent(`mode_widget_${this.mainForm.value.mode}`);
    }
    if (Object.entries(this.mainForm.value.style || {}).some(([key, value]) => value !== this.widget?.style?.[key])) {
      this.tracking.logEvent('mode_widget_style');
    }
  }

  onPlaceholderChange(value: string) {
    this.debouncePlaceholder.next(value);
  }
}
