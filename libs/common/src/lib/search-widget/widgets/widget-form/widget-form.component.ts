import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BackButtonComponent, BadgeComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AccordionBodyDirective,
  AccordionItemComponent,
  ModalConfig,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { SearchConfiguration, Widget } from '../../search-widget.models';
import { SearchWidgetService } from '../../search-widget.service';
import { combineLatest, filter, forkJoin, map, startWith, Subject, switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil, tap } from 'rxjs/operators';
import { deepEqual, FeaturesService, SDKService } from '@flaps/core';
import { SearchConfigurationComponent } from '../../search-configuration';
import { EmbedWidgetDialogComponent } from '../dialogs';
import { WidgetFeedback } from '@nuclia/core';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BackButtonComponent,
    TranslateModule,
    AccordionItemComponent,
    AccordionBodyDirective,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTextFieldModule,
    PaTogglesModule,
    SearchConfigurationComponent,
    BadgeComponent,
  ],
  templateUrl: './widget-form.component.html',
  styleUrl: './widget-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class WidgetFormComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sdk = inject(SDKService);
  private searchWidgetService = inject(SearchWidgetService);
  private translate = inject(TranslateService);
  private toaster = inject(SisToastService);
  private modalService = inject(SisModalService);
  private featureService = inject(FeaturesService);

  isSpeechEnabled = this.featureService.unstable.speech;

  private unsubscribeAll = new Subject<void>();

  @ViewChild('widgetOptions', { read: AccordionItemComponent }) widgetOptionsItem?: AccordionItemComponent;

  savedWidget?: Widget;
  currentWidget?: Widget;
  isNotModified = true;

  form = new FormGroup({
    widgetMode: new FormControl<'page' | 'popup' | 'chat'>('page', { nonNullable: true }),
    darkMode: new FormControl<'light' | 'dark'>('light', { nonNullable: true }),
    customizePlaceholder: new FormControl<boolean>(false, { nonNullable: true }),
    placeholder: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    customizeChatPlaceholder: new FormControl<boolean>(false, { nonNullable: true }),
    chatPlaceholder: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    customizeNotEnoughDataMessage: new FormControl<boolean>(false, { nonNullable: true }),
    notEnoughDataMessage: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    hideLogo: new FormControl<boolean>(false, { nonNullable: true }),
    noChatHistory: new FormControl<boolean>(false, { nonNullable: true }),
    permalink: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToLink: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToFile: new FormControl<boolean>(false, { nonNullable: true }),
    openNewTab: new FormControl<boolean>(false, { nonNullable: true }),
    speech: new FormControl<boolean>(false, { nonNullable: true }),
    speechSynthesis: new FormControl<boolean>(false, { nonNullable: true }),
    feedback: new FormControl<WidgetFeedback>('none', { nonNullable: true }),
    lang: new FormControl<string>('', { nonNullable: true }),
  });

  widgetFormExpanded = true;

  snippet = '';
  widgetPreview = this.searchWidgetService.widgetPreview.pipe(
    tap((data) => {
      this.snippet = data.snippet;
      this.cdr.markForCheck();
    }),
  );
  configChanges = new Subject<SearchConfiguration>();

  get customizePlaceholderEnabled() {
    return this.form.controls.customizePlaceholder.value;
  }
  get customizeChatPlaceholderEnabled() {
    return this.form.controls.customizeChatPlaceholder.value;
  }
  get customizeNotEnoughDataEnabled() {
    return this.form.controls.customizeNotEnoughDataMessage.value;
  }
  get darkModeEnabled() {
    return this.form.controls.darkMode.value === 'dark';
  }
  get popupStyleEnabled() {
    return this.form.controls.widgetMode.value === 'popup';
  }
  get navigateToLinkOrFileEnabled() {
    return this.form.controls.navigateToFile.value || this.form.controls.navigateToLink.value;
  }
  get speechOn() {
    return this.form.controls.speech.value;
  }

  ngOnInit() {
    this.route.params
      .pipe(
        filter((params) => !!params['slug']),
        map((params) => params['slug'] as string),
      )
      .pipe(
        switchMap((widgetSlug) =>
          forkJoin([this.sdk.currentKb.pipe(take(1)), this.searchWidgetService.widgetList.pipe(take(1))]).pipe(
            map(([kb, widgets]) => ({
              kbId: kb.id,
              widgetSlug,
              widget: widgets.find((widget) => widget.slug === widgetSlug),
            })),
          ),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(({ kbId, widget, widgetSlug }) => {
        if (!widget) {
          this.toaster.error(this.translate.instant('search.widgets.errors.widget-not-found', { widgetSlug }));
          this.router.navigate(['..'], { relativeTo: this.route });
        } else {
          this.searchWidgetService.saveSelectedSearchConfig(kbId, widget?.searchConfigId);
          this.initWidget(widget);
        }
      });

    combineLatest([this.form.valueChanges.pipe(startWith(this.form.getRawValue())), this.configChanges])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([widgetConfig, searchConfig]) => {
        if (this.currentWidget) {
          this.currentWidget.searchConfigId = searchConfig.id;
          this.currentWidget.widgetConfig = this.form.getRawValue();
        }
        if (!widgetConfig.permalink) {
          this.removeQueryParams();
        }
        this.checkIsModified();
        this.searchWidgetService.generateWidgetSnippet(
          searchConfig,
          this.form.getRawValue(),
          '.widget-preview-container',
        );
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.searchWidgetService.resetSearchQuery();
  }

  private initWidget(widget: Widget) {
    this.savedWidget = widget;
    this.currentWidget = { ...this.savedWidget };
    this.form.patchValue(this.currentWidget.widgetConfig);
    this.cdr.detectChanges();
  }

  updateWidgetOptionsHeight() {
    this.widgetOptionsItem?.updateContentHeight();
  }

  saveChanges() {
    const current = this.currentWidget;
    if (current) {
      this.searchWidgetService
        .updateWidget(current.slug, current.widgetConfig, current.searchConfigId)
        .pipe(switchMap(() => this.searchWidgetService.widgetList.pipe(take(1))))
        .subscribe((widgets) => {
          const widget = widgets.find((widget) => widget.slug === current.slug);
          if (widget) {
            this.initWidget(widget);
          }
        });
    }
  }

  embedWidget() {
    this.modalService.openModal(EmbedWidgetDialogComponent, new ModalConfig({ data: { code: this.snippet } }));
  }

  rename() {
    const current = this.currentWidget;
    if (current) {
      this.searchWidgetService
        .renameWidget(current.slug, current.name)
        .pipe(switchMap(() => this.searchWidgetService.widgetList.pipe(take(1))))
        .subscribe((widgets) => {
          const widget = widgets.find((widget) => widget.slug === current.slug);
          if (widget) {
            this.initWidget(widget);
          }
        });
    }
  }

  duplicateAsNew() {
    if (this.savedWidget) {
      this.searchWidgetService
        .duplicateWidget(this.savedWidget)
        .subscribe((slug) => this.router.navigate(['..', slug], { relativeTo: this.route }));
    }
  }

  delete() {
    if (this.savedWidget) {
      this.searchWidgetService
        .deleteWidget(this.savedWidget.slug, this.savedWidget.name)
        .subscribe(() => this.router.navigate(['..'], { relativeTo: this.route }));
    }
  }

  private removeQueryParams() {
    this.route.queryParams
      .pipe(
        take(1),
        filter((params) => Object.keys(params).length > 0),
      )
      .subscribe(() => this.router.navigate([]));
  }

  private checkIsModified() {
    if (this.savedWidget && this.currentWidget) {
      this.isNotModified = deepEqual(this.savedWidget, this.currentWidget);
      this.cdr.markForCheck();
    }
  }

  updateSearchConfig(searchConfig: SearchConfiguration) {
    this.configChanges.next(searchConfig);

    this.isNotModified = searchConfig.id === this.savedWidget?.searchConfigId;
    this.cdr.markForCheck();
  }

  onWidgetModeChange(value: string) {
    if (value === 'popup') {
      this.form.controls.darkMode.setValue('light');
    }
  }

  updateSpeechSynthesis(speechOn: boolean) {
    if (!speechOn) {
      this.form.controls.speechSynthesis.setValue(false);
    }
  }
}
