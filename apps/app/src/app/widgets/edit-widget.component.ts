import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendConfigurationService, STFTrackingService } from '@flaps/auth';
import { Widget } from '@nuclia/core';
import { filter, map, Subject, switchMap, takeUntil } from 'rxjs';
import { AddWidgetDialogComponent } from './add/add-widget.component';
import { WidgetService } from './widget.service';

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
    mode: ['button'],
    style: this.styleForm,
  });
  validationMessages = {
    title: {
      sluggable: 'stash.widgets.invalid-id',
    },
  };
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
  copyIcon = 'assets/icons/copy.svg';

  constructor(
    private fb: UntypedFormBuilder,
    private sanitized: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private widgetService: WidgetService,
    private dialog: MatDialog,
    private backendConfig: BackendConfigurationService,
    private tracking: STFTrackingService
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((params) => !!params.id),
        switchMap((params) => this.widgetService.getWidgetInfo(params.id))
      )
      .subscribe(({ widget, kbId, kbState, zone }) => {
        this.kbId = kbId;
        this.kbState = kbState || '';
        this.zone = zone;
        this.widget = widget;
        this.isDefaultWidget = widget.id === 'dashboard';
        this.mainForm.patchValue(widget);
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
      this.widgetService
        .saveWidget(this.widget.id, {
          ...this.widget,
          ...this.mainForm.value,
        })
        .subscribe();
    }
  }

  generateSnippet() {
    if (!this.widget) {
      return;
    }
    this.deletePreview();
    const cdn = this.backendConfig.getCDN() || '';
    this.snippet = `<script src="${cdn}/nuclia-widget.umd.js"></script>
<nuclia-search
  knowledgebox="${this.kbId}"
  zone="${this.zone}"
  widgetid="${this.widget.id}"
  type="${this.mainForm.get('mode')?.value || ''}"
></nuclia-search>`;
    const styles = Object.entries(this.styleForm.value)
      .filter(([key, value]) => !!value)
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
      state="${this.kbState}" zone=`
      ) + styleStr
    );
    this.cdr?.markForCheck();
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
      this.dialog
        .open(AddWidgetDialogComponent, { width: '530px', data: { rename: true } })
        .afterClosed()
        .pipe(
          filter((result) => !!result && !!result.id),
          switchMap((result) =>
            this.widgetService.saveWidget(widget.id, { id: result.id as string }).pipe(map(() => result.id))
          )
        )
        .subscribe((id) => {
          this.widgetService.updateWidgets();
          this.router.navigate([`../${id}`], { relativeTo: this.route });
        });
    }
  }

  copy() {
    navigator.clipboard.writeText(this.snippet);
    this.copyIcon = 'assets/icons/check.svg';
    this.cdr?.markForCheck();
    setTimeout(() => {
      this.copyIcon = 'assets/icons/copy.svg';
      this.cdr?.markForCheck();
    }, 1000);
  }

  private trackChanges() {
    if (this.mainForm.value.mode !== this.widget?.mode) {
      this.tracking.logEvent(`mode_widget_${this.mainForm.value.mode}`);
    }
    if (Object.entries(this.mainForm.value.style).some(([key, value]) => value !== this.widget?.style?.[key])) {
      this.tracking.logEvent('mode_widget_style');
    }
  }
}
