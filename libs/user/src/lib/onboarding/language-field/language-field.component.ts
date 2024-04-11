import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { FeaturesService } from '@flaps/core';

const LANGUAGES = [
  'arabic',
  'catalan',
  'chinese',
  'danish',
  'english',
  'finnish',
  'french',
  'german',
  'italian',
  'japanese',
  'norwegian',
  'portuguese',
  'spanish',
  'swedish',
];

@Component({
  selector: 'nus-language-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, PaTogglesModule],
  templateUrl: './language-field.component.html',
  styleUrl: './language-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageFieldComponent implements OnInit, OnDestroy {
  @Output() languageSelected = new EventEmitter<{
    multilingualSelected: boolean;
    languages: string[];
    semanticModel: string;
  }>();

  private unsubscribeAll = new Subject<void>();

  multilingual = new FormControl<'multilingual' | 'english'>('multilingual', { nonNullable: true });
  languages: { id: string; label: string; selected: boolean }[];
  isEnglishEnabled = this.features.englishModel;
  areOpenAIModelsEnabled = this.features.openAIModels;
  isGeckoModelEnabled = this.features.geckoModel;

  get multilingualSelected() {
    return this.multilingual.value === 'multilingual';
  }

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
  ) {
    const languages: { id: string; label: string }[] = LANGUAGES.map((language) => ({
      id: language,
      label: this.translate.instant(`onboarding.step2.languages.${language}`),
    })).sort((a, b) => a.label.localeCompare(b.label));
    languages.push({ id: 'other', label: this.translate.instant(`onboarding.step2.languages.other`) });
    this.languages = languages.map((language) => ({ ...language, selected: false }));
  }

  ngOnInit() {
    this.multilingual.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe((language) => {
      if (language === 'english') {
        this.languages.forEach((language) => (language.selected = false));
        this.cdr.markForCheck();
      }

      this.sendSelection();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  sendSelection() {
    this.languageSelected.emit({
      semanticModel: this.multilingual.value,
      multilingualSelected: this.multilingualSelected,
      languages: this.languages.filter((language) => language.selected).map((language) => language.id),
    });
  }
}
