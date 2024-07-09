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
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import {
  AccordionItemComponent,
  PaExpanderModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { FeaturesService } from '@flaps/core';
import { BadgeComponent } from '@nuclia/sistema';
import { LearningConfigurationProperty, LearningConfigurations } from '@nuclia/core';
import { DynamicFieldComponent } from './dynamic-field.component';

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
  userKeys?: { [key: string]: any };
}

@Component({
  selector: 'nus-language-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTogglesModule,
    BadgeComponent,
    PaTextFieldModule,
    DynamicFieldComponent,
    AccordionItemComponent,
    PaExpanderModule,
  ],
  templateUrl: './language-field.component.html',
  styleUrl: './language-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LanguageFieldComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() set languageModel(value: EmbeddingModelForm | undefined) {
    if (value) {
      this.form.patchValue(value);
    }
  }
  @Input() set learningSchema(schema: LearningConfigurations) {
    const embeddingsSchema = schema['user_keys']?.schemas?.['hf_embedding'];
    // If hugging face form is already set, we stop listening to its changes before updating it
    if (this.huggingFaceForm) {
      this.unsubscribeHuggingFace.next();
    }
    if (embeddingsSchema) {
      const huggingFaceProperties = Object.entries(embeddingsSchema.properties || {});
      this.huggingFaceRequiredFields = embeddingsSchema.required.map((key) => ({
        key,
        value: {
          ...embeddingsSchema.properties[key],
          description: `${
            embeddingsSchema.properties[key].description ? embeddingsSchema.properties[key].description + ' ' : ''
          }(${this.translate.instant('validation.required')})`,
        },
      }));
      const optionalFields: { key: string; value: LearningConfigurationProperty }[] = [];
      huggingFaceProperties
        .filter(([key]) => !embeddingsSchema.required.includes(key))
        .forEach(([key, value]) => {
          optionalFields.push({ key, value });
        });
      this.huggingFaceOptionalFields = optionalFields;

      const form = new FormGroup({});
      huggingFaceProperties.forEach(([key, property]) => {
        const validators = embeddingsSchema.required.includes(key) ? [Validators.required] : [];
        switch (property.type) {
          case 'integer':
          case 'number':
            form.addControl(
              key,
              new FormControl<number | null>(property.default || null, { validators, updateOn: 'blur' }),
            );
            break;
          default:
            form.addControl(key, new FormControl<string>(property.default || '', { validators, updateOn: 'blur' }));
            break;
        }
      });
      this.huggingFaceForm = form;
      this.huggingFaceForm.valueChanges
        .pipe(takeUntil(this.unsubscribeHuggingFace))
        .subscribe(() => this.sendSelection());
    }
  }

  @Output() modelSelected = new EventEmitter<EmbeddingModelForm>();

  private unsubscribeAll = new Subject<void>();
  private unsubscribeHuggingFace = new Subject<void>();

  form = new FormGroup({
    modelType: new FormControl<'private' | 'public'>('private', { nonNullable: true }),
    semanticModel: new FormControl<string>('GECKO_MULTI', { nonNullable: true }),
  });

  readonly HUGGING_FACE_MODEL = 'HF';
  huggingFaceForm?: FormGroup;
  huggingFaceRequiredFields: { key: string; value: LearningConfigurationProperty }[] = [];
  huggingFaceOptionalFields: { key: string; value: LearningConfigurationProperty }[] = [];

  languages: { id: string; label: string; selected: boolean }[];

  areOpenAIModelsEnabled = this.features.unstable.openAIModels;
  isGeckoModelEnabled = this.features.unstable.geckoModel;
  isExtraSemanticModelEnabled = this.features.unstable.extraSemanticModel;
  isHuggingFaceSemanticModelEnabled = this.features.unstable.huggingFaceSemanticModel;

  get semanticModelValue() {
    return this.form.controls.semanticModel.value;
  }

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
    this.unsubscribeHuggingFace.next();
    this.unsubscribeHuggingFace.complete();
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
    let userKeys;
    if (data.semanticModel === this.HUGGING_FACE_MODEL) {
      const extraFields = this.huggingFaceForm?.getRawValue();

      // Matryoshka is supposed to be an array of integers, but it's hard to make it a generic dynamical field with the current schema,
      // so we just format matryoshka field statically afterward
      if (typeof extraFields['matryoshka'] === 'string') {
        extraFields['matryoshka'] = extraFields['matryoshka']
          .split(',')
          .filter((value) => !!value.trim())
          .map((value) => parseInt(value, 10));
      }
      userKeys = {
        hf_embedding: extraFields,
      };
    }
    this.modelSelected.emit({
      embeddingModel: model,
      modelType: data.modelType,
      userKeys,
    });
  }
}
