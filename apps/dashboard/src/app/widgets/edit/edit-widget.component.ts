import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendConfigurationService, STFTrackingService } from '@flaps/core';
import { Widget } from '@nuclia/core';
import { filter, map, skip, Subject, switchMap, takeUntil } from 'rxjs';
import { AddWidgetDialogComponent } from '../add/add-widget.component';
import { DEFAULT_FEATURES, WidgetService } from '../widget.service';
import { markForCheck, TranslateService } from '@guillotinaweb/pastanaga-angular';
import { debounceTime } from 'rxjs/operators';
import { SisModalService } from '@nuclia/sistema';
import { WidgetHintDialogComponent } from '../hint/widget-hint.component';

@Component({
  selector: 'app-edit-widget',
  templateUrl: 'edit-widget.component.html',
  styleUrls: ['./edit-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditWidgetComponent implements OnInit, OnDestroy {
  mainForm = this.fb.group({
    mode: ['input'],
    features: this.fb.group({
      editLabels: [false],
      entityAnnotation: [false],
      filter: [false],
      navigateToLink: [false],
      permalink: [false],
      suggestLabels: [false],
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
    private route: ActivatedRoute,
    private router: Router,
    private widgetService: WidgetService,
    private dialog: MatDialog,
    private backendConfig: BackendConfigurationService,
    private tracking: STFTrackingService,
    private translation: TranslateService,
    private modalService: SisModalService,
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
      const { ...mainForm } = this.mainForm.getRawValue();
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
  type="${mode}"
  features="${this.features}" ${placeholder}
></nuclia-search>`
        : `<script src="${cdn}/nuclia-video-widget.umd.js"></script>
<nuclia-search-bar
  knowledgebox="${this.kbId}"
  zone="${this.zone}"
  widgetid="${this.widget.id}"
  features="${this.features}" ${placeholder}
></nuclia-search-bar>
<nuclia-search-results></nuclia-search-results>`;

    this.snippetPreview = this.sanitized.bypassSecurityTrustHtml(
      this.snippet.replace(
        'zone=',
        `client="dashboard" backend="${this.backendConfig.getAPIURL()}"
      lang="${this.translation.currentLang}"
      state="${this.kbState}" notpublic zone=`,
      ),
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
  }

  onPlaceholderChange(value: string) {
    this.debouncePlaceholder.next(value);
  }

  showHints() {
    this.modalService.openModal(WidgetHintDialogComponent);
  }
}
