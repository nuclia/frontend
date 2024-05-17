import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
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

export interface EmbeddingModelForm {
  modelType: 'private' | 'public';
  embeddingModel: string;
}

@Component({
  selector: 'nus-language-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, PaTogglesModule],
  templateUrl: './language-field.component.html',
  styleUrl: './language-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageFieldComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() set languageModel(value: EmbeddingModelForm | undefined) {
    if (value) {
      this.form.patchValue(value);
    }
  }

  @Output() modelSelected = new EventEmitter<EmbeddingModelForm>();

  private unsubscribeAll = new Subject<void>();

  form = new FormGroup({
    modelType: new FormControl<'private' | 'public'>('private', { nonNullable: true }),
    semanticModel: new FormControl<string>('GECKO_MULTI', { nonNullable: true }),
  });

  languages: { id: string; label: string; selected: boolean }[];

  areOpenAIModelsEnabled = this.features.unstable.openAIModels;
  isGeckoModelEnabled = this.features.unstable.geckoModel;
  isExtraSemanticModelEnabled = this.features.unstable.extraSemanticModel;

  constructor(
    private translate: TranslateService,
    private features: FeaturesService,
  ) {
    const languages: { id: string; label: string }[] = LANGUAGES.map((language) => ({
      id: language,
      label: this.translate.instant(`user.kb.creation-form.models.nuclia-model.languages.${language}`),
    })).sort((a, b) => a.label.localeCompare(b.label));
    languages.push({
      id: 'other',
      label: this.translate.instant(`user.kb.creation-form.models.nuclia-model.languages.other`),
    });
    this.languages = languages.map((language) => ({ ...language, selected: false }));
  }

  ngOnInit() {
    this.sendSelection();
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.sendSelection());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['disabled']) {
      if (changes['disabled'].currentValue) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  sendSelection() {
    const data = this.form.getRawValue();
    let model: string;
    if (data.modelType === 'private') {
      const lang = this.languages.filter((language) => language.selected).map((language) => language.id);
      if (lang.includes('catalan') || lang.includes('other')) {
        model = 'MULTILINGUAL_ALPHA';
      } else if (lang.length === 1 && lang[0] === 'english') {
        model = 'ENGLISH';
      } else {
        model = 'MULTILINGUAL';
      }
    } else {
      model = data.semanticModel;
    }
    this.modelSelected.emit({
      embeddingModel: model,
      modelType: data.modelType,
    });
  }
}
