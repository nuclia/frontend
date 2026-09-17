import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FeaturesService } from '@flaps/core';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Widget } from '@nuclia/core';
import { BadgeComponent } from '@nuclia/sistema';
import { startWith, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Widget appearance/deployment options form, extracted from the standalone widget editor so it can be
 * reused as an accordion section in the shared search configuration panel (see Search + Widgets
 * consolidation plan). Deliberately excludes the RAO/arag-specific workflow form, which stays out of
 * scope for this pass.
 */
@Component({
  selector: 'stf-widget-options-form',
  imports: [CommonModule, ReactiveFormsModule, PaTogglesModule, PaTextFieldModule, TranslateModule, BadgeComponent],
  templateUrl: './widget-options-form.component.html',
  styleUrl: './widget-options-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetOptionsFormComponent implements OnInit, OnDestroy {
  private featuresService = inject(FeaturesService);
  private unsubscribeAll = new Subject<void>();

  @Input() set config(value: Widget.WidgetConfiguration | undefined) {
    if (value) {
      this.form.patchValue(value);
      this.onWidgetModeChange(value.widgetMode);
      this.onNavigationChange(value);
      if (value.speech) {
        this.enableSpeechSynthesis();
      } else {
        this.disableSpeechSynthesis();
      }
    }
  }

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<Widget.WidgetConfiguration>();

  isSpeechEnabled = this.featuresService.unstable.speech;

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
    hideReset: new FormControl<boolean>(false, { nonNullable: true }),
    // Floating chat options
    fabPosition: new FormControl<'bottom-right' | 'bottom-left'>('bottom-right', { nonNullable: true }),
    fabSize: new FormControl<'small' | 'medium' | 'large'>('medium', { nonNullable: true }),
    fabOffsetBottom: new FormControl<number>(24, { nonNullable: true }),
    fabOffsetSide: new FormControl<number>(24, { nonNullable: true }),
    panelWidth: new FormControl<number>(400, { nonNullable: true }),
    panelHeight: new FormControl<number>(600, { nonNullable: true }),
  });

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

  ngOnInit() {
    this.form.valueChanges.pipe(startWith(this.form.getRawValue()), takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.configChanged.emit(this.form.getRawValue());
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateWidgetOptionsHeight() {
    this.heightChanged.emit();
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
    setTimeout(() => this.updateWidgetOptionsHeight());
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

  enableSpeechSynthesis() {
    this.form.controls.speechSynthesis.enable();
  }

  disableSpeechSynthesis() {
    this.form.controls.speechSynthesis.setValue(false);
    this.form.controls.speechSynthesis.disable();
  }
}
