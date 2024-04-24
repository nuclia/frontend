import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  @Output() modelSelected = new EventEmitter<string>();

  private unsubscribeAll = new Subject<void>();

  form = new FormGroup({
    modelType: new FormControl<'private' | 'public'>('private', { nonNullable: true }),
    model: new FormControl<string>('GECKO_MULTI', { nonNullable: true }),
  });

  languages: { id: string; label: string; selected: boolean }[];

  areOpenAIModelsEnabled = this.features.openAIModels;
  isGeckoModelEnabled = this.features.geckoModel;

  constructor(
    private translate: TranslateService,
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
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.sendSelection());
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  sendSelection() {
    const data = this.form.value;
    if (data.modelType === 'private') {
      const lang = this.languages.filter((language) => language.selected).map((language) => language.id);
      if (lang.includes('catalan') || lang.includes('other')) {
        this.modelSelected.emit('MULTILINGUAL_ALPHA');
      } else if (lang.length === 1 && lang[0] === 'english') {
        this.modelSelected.emit('ENGLISH');
      } else {
        this.modelSelected.emit('MULTILINGUAL');
      }
    } else {
      this.modelSelected.emit(data.model);
    }
  }
}
