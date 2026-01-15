import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { deepEqual, FeaturesService, NavigationService, SDKService } from '@flaps/core';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Widget } from '@nuclia/core';
import { BackButtonComponent, BadgeComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { combineLatest, filter, forkJoin, map, merge, Observable, of, startWith, Subject, switchMap, take } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { SearchConfigurationComponent } from '../../search-configuration';
import { SearchWidgetService } from '../../search-widget.service';
import { EmbedWidgetDialogComponent } from '../dialogs';

type RaoViewType = 'conversation' | 'floating';

type RaoPromptConfigControls = {
  prompts: FormArray<FormControl<string>>;
  usefallbackprompts: FormControl<boolean>;
  visibleprompts: FormControl<number>;
};

type RaoRecordingConfigControls = {
  language: FormControl<string>;
};

type RaoFormGroupControls = {
  title: FormControl<string>;
  username: FormControl<string>;
  viewtype: FormControl<RaoViewType>;
  promptconfig: FormGroup<RaoPromptConfigControls>;
  recordingconfig: FormGroup<RaoRecordingConfigControls>;
};

type RaoFormValue = {
  title: string;
  username: string;
  viewtype: RaoViewType;
  promptconfig: {
    prompts: string[];
    usefallbackprompts: boolean;
    visibleprompts: number;
  };
  recordingconfig: {
    language: string;
  };
};

@Component({
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
export class WidgetFormComponent implements AfterViewInit, OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sdk = inject(SDKService);
  private searchWidgetService = inject(SearchWidgetService);
  private translate = inject(TranslateService);
  private toaster = inject(SisToastService);
  private modalService = inject(SisModalService);
  private featureService = inject(FeaturesService);
  private navigationService = inject(NavigationService);

  isSpeechEnabled = this.featureService.unstable.speech;

  private unsubscribeAll = new Subject<void>();

  @ViewChild('widgetOptions', { read: AccordionItemComponent }) widgetOptionsItem?: AccordionItemComponent;

  savedWidget?: Widget.Widget;
  currentWidget?: Widget.Widget;
  currentRaoWidget?: Widget.RaoWidget;
  private savedRaoConfig?: Widget.RaoWidgetConfiguration;
  private currentRaoConfig?: Widget.RaoWidgetConfiguration;
  isNotModified = true;

  form = new FormGroup({
    widgetMode: new FormControl<'page' | 'popup' | 'chat' | 'floating-chat'>('page', { nonNullable: true }),
    darkMode: new FormControl<'light' | 'dark'>('light', { nonNullable: true }),
    customizePlaceholder: new FormControl<boolean>(false, { nonNullable: true }),
    placeholder: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    customizeChatPlaceholder: new FormControl<boolean>(false, { nonNullable: true }),
    chatPlaceholder: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    customizeCopyDisclaimer: new FormControl<boolean>(false, { nonNullable: true }),
    copyDisclaimer: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    customizeNotEnoughDataMessage: new FormControl<boolean>(false, { nonNullable: true }),
    notEnoughDataMessage: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    hideLogo: new FormControl<boolean>(false, { nonNullable: true }),
    noChatHistory: new FormControl<boolean>(false, { nonNullable: true }),
    persistChatHistory: new FormControl<boolean>(false, { nonNullable: true }),
    permalink: new FormControl<boolean>(false, { nonNullable: true }),
    displaySearchButton: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToLink: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToFile: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToOriginURL: new FormControl<boolean>(false, { nonNullable: true }),
    hideDownload: new FormControl<boolean>(false, { nonNullable: true }),
    openNewTab: new FormControl<boolean>(false, { nonNullable: true }),
    speech: new FormControl<boolean>(false, { nonNullable: true }),
    speechSynthesis: new FormControl<boolean>(false, { nonNullable: true }),
    feedback: new FormControl<Widget.WidgetFeedback>('none', { nonNullable: true }),
    lang: new FormControl<string>('', { nonNullable: true }),
    customizeTextBlocksVisibility: new FormControl<boolean>(false, { nonNullable: true }),
    textBlocksVisibility: new FormControl<'expanded' | 'collapsed'>('expanded', { nonNullable: true }),
    customizeCitationVisibility: new FormControl<boolean>(false, { nonNullable: true }),
    citationVisibility: new FormControl<'expanded' | 'collapsed'>('expanded', { nonNullable: true }),
    // Floating chat options
    fabPosition: new FormControl<'bottom-right' | 'bottom-left'>('bottom-right', { nonNullable: true }),
    fabSize: new FormControl<'small' | 'medium' | 'large'>('medium', { nonNullable: true }),
    fabOffsetBottom: new FormControl<number>(24, { nonNullable: true }),
    fabOffsetSide: new FormControl<number>(24, { nonNullable: true }),
    panelWidth: new FormControl<number>(400, { nonNullable: true }),
    panelHeight: new FormControl<number>(600, { nonNullable: true }),
  });

  raoForm = new FormGroup<RaoFormGroupControls>({
    title: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    username: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    viewtype: new FormControl<RaoViewType>('conversation', { nonNullable: true }),
    promptconfig: new FormGroup<RaoPromptConfigControls>({
      prompts: new FormArray<FormControl<string>>([
        new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
      ]),
      usefallbackprompts: new FormControl<boolean>(false, { nonNullable: true }),
      visibleprompts: new FormControl<number>(4, { nonNullable: true }),
    }),
    recordingconfig: new FormGroup<RaoRecordingConfigControls>({
      language: new FormControl<string>('en-US', { nonNullable: true, updateOn: 'blur' }),
    }),
  });

  widgetFormExpanded = true;

  snippets?: { snippet: string; synchSnippet?: string };
  widgetPreview = this.searchWidgetService.widgetPreview.pipe(
    tap((data) => {
      this.snippets = data;
      this.cdr.markForCheck();
    }),
  );
  configChanges = new Subject<Widget.SearchConfiguration>();

  inArag: Observable<boolean> = merge(
    of(this.navigationService.inAragSpace(location.pathname)),
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => this.navigationService.inAragSpace((event as NavigationEnd).url)),
      takeUntil(this.unsubscribeAll),
    ),
  );

  get customizePlaceholderEnabled() {
    return this.form.controls.customizePlaceholder.value;
  }
  get customizeChatPlaceholderEnabled() {
    return this.form.controls.customizeChatPlaceholder.value;
  }
  get customizeCopyDisclaimerEnabled() {
    return this.form.controls.customizeCopyDisclaimer.value;
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
  get chatStyleEnabled() {
    return this.form.controls.widgetMode.value === 'chat';
  }
  get floatingChatStyleEnabled() {
    return this.form.controls.widgetMode.value === 'floating-chat';
  }
  get speechOn() {
    return this.form.controls.speech.value;
  }
  get customizeTextBlocksVisibilityEnabled() {
    return this.form.controls.customizeTextBlocksVisibility.value;
  }
  get customizeCitationVisibilityEnabled() {
    return this.form.controls.customizeCitationVisibility.value;
  }
  get openNewTabControl() {
    return this.form.controls.openNewTab;
  }
  get openNewTabDisabled() {
    return this.openNewTabControl.disabled;
  }
  get promptControls(): FormArray<FormControl<string>> {
    return this.raoForm.controls.promptconfig.controls.prompts;
  }
  addPrompt() {
    this.promptControls.push(new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }));
    this.cdr.markForCheck();
  }
  removePrompt(index: number) {
    this.promptControls.removeAt(index);
    if (this.promptControls.length === 0) {
      this.promptControls.push(new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }), {
        emitEvent: false,
      });
    }
    this.cdr.markForCheck();
  }
  trackPromptIndex(index: number) {
    return index;
  }
  ngOnInit() {
    this.resetRaoForm();
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
          { ...searchConfig, type: 'config' },
          this.form.getRawValue(),
          this.currentWidget?.slug,
          '.widget-preview-container',
        );
      });

    this.raoForm.valueChanges
      .pipe(startWith(this.raoForm.getRawValue()), takeUntil(this.unsubscribeAll))
      .subscribe((rawValue) => {
        const widgetConfig = this.sanitizeRaoWidgetConfig(rawValue as RaoFormValue);
        this.currentRaoConfig = widgetConfig;
        if (this.currentRaoWidget) {
          this.currentRaoWidget.widgetConfig = widgetConfig;
        }
        this.checkIsModified();
        this.searchWidgetService.generateRaoWidgetSnippet(widgetConfig, this.currentWidget?.slug);
      });

    this.updateSpeechSynthesis(this.speechOn);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateWidgetOptionsHeight();
    }, 100);
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.searchWidgetService.resetSearchQuery();
  }

  private initWidget(widget: Widget.Widget) {
    this.savedWidget = widget;
    this.currentWidget = { ...this.savedWidget };
    this.form.patchValue(this.currentWidget.widgetConfig);
    this.onWidgetModeChange(this.currentWidget.widgetConfig.widgetMode);
    this.onNavigationChange(this.currentWidget.widgetConfig);
    this.cdr.detectChanges();
  }

  private resetRaoForm(config?: Widget.RaoWidgetConfiguration) {
    const promptsSource = config?.promptconfig?.prompts ?? [];
    const prompts = promptsSource.length > 0 ? promptsSource : [''];
    const visiblePrompts = config?.promptconfig?.visibleprompts ?? Math.max(prompts.length, 1);

    this.raoForm.patchValue(
      {
        viewtype: config?.viewtype ?? 'conversation',
        promptconfig: {
          usefallbackprompts: config?.promptconfig?.usefallbackprompts ?? false,
          visibleprompts: visiblePrompts,
        },
        recordingconfig: {
          language: config?.recordingconfig?.language ?? 'en-US',
        },
      },
      { emitEvent: false },
    );

    const promptsArray = this.promptControls;
    while (promptsArray.length > 0) {
      promptsArray.removeAt(0, { emitEvent: false });
    }
    prompts.forEach((prompt) => {
      promptsArray.push(new FormControl<string>(prompt, { nonNullable: true, updateOn: 'blur' }), {
        emitEvent: false,
      });
    });
    if (promptsArray.length === 0) {
      promptsArray.push(new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }), {
        emitEvent: false,
      });
    }

    this.savedRaoConfig = this.sanitizeRaoWidgetConfig(this.raoForm.getRawValue() as RaoFormValue);
    this.currentRaoConfig = this.savedRaoConfig;
    this.raoForm.markAsPristine();
    this.raoForm.markAsUntouched();
    this.cdr.markForCheck();
  }

  private sanitizeRaoWidgetConfig(raw: RaoFormValue): Widget.RaoWidgetConfiguration {
    const config: Widget.RaoWidgetConfiguration = {};

    if (raw.viewtype) {
      config.viewtype = raw.viewtype;
    }

    const prompts = (raw.promptconfig?.prompts ?? [])
      .map((prompt) => prompt.trim())
      .filter((prompt) => prompt.length > 0);
    const useFallback = raw.promptconfig?.usefallbackprompts ?? false;
    const visiblePromptsRaw = raw.promptconfig?.visibleprompts;
    const visiblePromptsNumber = Number(visiblePromptsRaw);
    const hasVisiblePrompts = Number.isFinite(visiblePromptsNumber) && visiblePromptsNumber > 0;

    if (prompts.length > 0 || useFallback || hasVisiblePrompts) {
      const sanitizedPromptConfig: NonNullable<Widget.RaoWidgetConfiguration['promptconfig']> = {
        prompts,
      };
      if (useFallback) {
        sanitizedPromptConfig.usefallbackprompts = true;
      }
      if (hasVisiblePrompts) {
        const capped = prompts.length > 0 ? Math.min(visiblePromptsNumber, prompts.length) : visiblePromptsNumber;
        sanitizedPromptConfig.visibleprompts = Math.max(1, capped);
      }
      config.promptconfig = sanitizedPromptConfig;
    }

    const language = raw.recordingconfig?.language?.trim();
    if (language) {
      config.recordingconfig = { language };
    }

    return config;
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
    if (this.snippets) {
      this.inArag
        .pipe(take(1))
        .subscribe((inArag) =>
          this.modalService.openModal(
            EmbedWidgetDialogComponent,
            new ModalConfig({ data: { code: this.snippets, hideSync: inArag } }),
          ),
        );
    }
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
    const widgetUnchanged =
      this.savedWidget && this.currentWidget ? deepEqual(this.savedWidget, this.currentWidget) : true;
    const raoUnchanged =
      this.savedRaoConfig && this.currentRaoConfig ? deepEqual(this.savedRaoConfig, this.currentRaoConfig) : true;
    this.isNotModified = widgetUnchanged && raoUnchanged;
    this.cdr.markForCheck();
  }

  updateSearchConfig(searchConfig: Widget.AnySearchConfiguration) {
    if (searchConfig.type === 'api') {
      return;
    }
    this.configChanges.next(searchConfig);

    this.isNotModified = searchConfig.id === this.savedWidget?.searchConfigId;
    this.cdr.markForCheck();
  }

  onWidgetModeChange(value: string) {
    if (value === 'popup') {
      this.form.controls.darkMode.setValue('light');
    }
    if (value !== 'chat' && value !== 'floating-chat') {
      this.form.controls.persistChatHistory.setValue(false);
      this.form.controls.persistChatHistory.disable();
    } else {
      this.form.controls.persistChatHistory.enable();
    }
    setTimeout(() => {
      this.updateWidgetOptionsHeight();
    });
  }

  onNavigationChange(value: Partial<Widget.WidgetConfiguration>) {
    const config = { ...this.form.getRawValue(), ...value };
    if (!config.navigateToLink && !config.navigateToFile && !config.navigateToOriginURL && !config.permalink) {
      this.openNewTabControl.setValue(false);
      this.openNewTabControl.disable();
    } else {
      this.openNewTabControl.enable();
    }
  }

  updateSpeechSynthesis(speechOn: boolean) {
    if (!speechOn) {
      this.form.controls.speechSynthesis.setValue(false);
      this.form.controls.speechSynthesis.disable();
    } else {
      this.form.controls.speechSynthesis.enable();
    }
  }
}
