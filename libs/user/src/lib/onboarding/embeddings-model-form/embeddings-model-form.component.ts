import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, take, takeUntil } from 'rxjs';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  PaExpanderModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
  transitionDuration,
} from '@guillotinaweb/pastanaga-angular';
import { FeaturesService, getSemanticModels } from '@flaps/core';
import { BadgeComponent, InfoCardComponent } from '@nuclia/sistema';
import { LearningConfigurationProperty, LearningConfigurations } from '@nuclia/core';
import { DynamicFieldsComponent } from './dynamic-fields.component';

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

export interface LearningConfigurationForm {
  semantic_models: string[];
  user_keys?: { [key: string]: unknown };
}

@Component({
  selector: 'nus-embeddings-model-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTogglesModule,
    BadgeComponent,
    PaTextFieldModule,
    DynamicFieldsComponent,
    AccordionItemComponent,
    PaExpanderModule,
    InfoCardComponent,
    AccordionComponent,
    AccordionItemComponent,
    AccordionBodyDirective,
    PaIconModule,
    PaPopupModule,
  ],
  templateUrl: './embeddings-model-form.component.html',
  styleUrl: './embeddings-model-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmbeddingsModelFormComponent implements OnInit, OnChanges, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  private unsubscribeAll = new Subject<void>();
  private unsubscribeHuggingFace = new Subject<void>();
  private _learningSchema?: LearningConfigurations;

  @Input({ transform: booleanAttribute }) standalone = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input()
  get learningSchema(): LearningConfigurations | undefined {
    return this._learningSchema;
  }
  set learningSchema(schema: LearningConfigurations | null) {
    if (!schema) {
      return;
    }
    this._learningSchema = schema;
    this.isHuggingFaceSemanticModelEnabled.pipe(take(1)).subscribe((huggingFaceEnabled) => {
      this.semanticModels = (schema['semantic_models']?.options || []).reduce(
        (modelMap, model) => {
          if (!huggingFaceEnabled && model.name === this.HUGGING_FACE_MODEL) {
            return modelMap;
          }
          modelMap[model.name] = model.value;
          if (
            !Object.keys(this.nucliaModelControls).includes(model.name) &&
            !Object.keys(this.stageOnlyModelControls).includes(model.name)
          ) {
            // Currently schema endpoint on NucliaDB Admin doesn't support user_keys, so we can't provide HuggingFace
            if (model.name !== this.HUGGING_FACE_MODEL || !this.standalone) {
              this.form.controls.external.addControl(
                model.name,
                new FormControl<boolean>(false, { nonNullable: true }),
              );
            }
          }
          return modelMap;
        },
        {} as { [modelName: string]: string },
      );
    });

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
        .subscribe(() => this.validateModelSelection());
    }
  }

  @Output() learningConfiguration = new EventEmitter<LearningConfigurationForm>();

  @ViewChild('externalModelsContainer', { read: AccordionItemComponent })
  externalModelsContainer?: AccordionItemComponent;

  form = new FormGroup({
    nuclia: new FormGroup({
      ENGLISH: new FormControl<boolean>(false),
      MULTILINGUAL: new FormControl<boolean>(true),
      MULTILINGUAL_ALPHA: new FormControl<boolean>(false),
    }),
    external: new FormGroup<{ [key: string]: AbstractControl<boolean> }>({}),
    stageOnly: new FormGroup({
      MULTILINGUAL_EXTRA: new FormControl<boolean>(false, { nonNullable: true }),
    }),
  });

  semanticModels: { [modelName: string]: string } = {};

  readonly HUGGING_FACE_MODEL = 'HF';
  MODEL_SELECTION_LIMIT = 5;

  huggingFaceForm?: FormGroup;
  huggingFaceRequiredFields: { key: string; value: LearningConfigurationProperty }[] = [];
  huggingFaceOptionalFields: { key: string; value: LearningConfigurationProperty }[] = [];

  languages: { id: string; label: string; selected: boolean }[];

  isExtraSemanticModelEnabled = this.features.unstable.extraSemanticModel;
  isHuggingFaceSemanticModelEnabled = this.features.unstable.huggingFaceSemanticModel;

  get nucliaModelControls() {
    return this.form.controls.nuclia.controls;
  }
  get externalModelControls() {
    return this.form.controls.external.controls;
  }
  get stageOnlyModelControls() {
    return this.form.controls.stageOnly.controls;
  }
  get huggingFaceControl() {
    return this.externalModelControls[this.HUGGING_FACE_MODEL];
  }
  get isHuggingFaceSelected() {
    return this.huggingFaceControl?.value;
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

    this.features.authorized.vectorset.pipe(take(1)).subscribe((vectorsetEnabled) => {
      this.MODEL_SELECTION_LIMIT = vectorsetEnabled ? 5 : 1;
      this.cdr.markForCheck();
    });
  }

  ngOnInit() {
    this.validateModelSelection();
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.validateModelSelection());
    this.huggingFaceControl?.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => this.updateExternalAccordionHeight());
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

  updateExternalAccordionHeight() {
    this.externalModelsContainer?.updateContentHeight();
    // Advanced hugging face form is in an expander, so we need to take expander animation time into account
    setTimeout(() => {
      this.externalModelsContainer?.updateContentHeight();
      this.cdr.detectChanges();
    }, transitionDuration + 10);
  }

  sendSelection() {
    if (!this.learningSchema) {
      return;
    }
    const data = this.form.getRawValue();
    const embeddingModels = Object.values(data).reduce((modelList, group) => {
      return modelList.concat(
        Object.entries(group).reduce((models, [key, selected]) => {
          if (selected) {
            models.push(key);
          }
          return models;
        }, [] as string[]),
      );
    }, [] as string[]);

    let userKeys;
    if (embeddingModels.includes(this.HUGGING_FACE_MODEL)) {
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

    this.learningConfiguration.emit({
      semantic_models: getSemanticModels(embeddingModels, this.learningSchema),
      user_keys: userKeys,
    });
  }

  /**
   * Backend is restricting the number of models that can be selected for one KB
   */
  private validateModelSelection() {
    const data = this.form.getRawValue();
    const selectionCount = Object.values(data).reduce((count, group) => {
      return (
        count +
        Object.values(group).reduce((subCount, selected) => {
          if (selected) {
            subCount += 1;
          }
          return subCount;
        }, 0)
      );
    }, 0);

    if (selectionCount >= this.MODEL_SELECTION_LIMIT) {
      this.disableUnselectedModels();
    } else {
      this.enableAllModels();
    }
    this.sendSelection();
  }

  private disableUnselectedModels() {
    Object.values(this.nucliaModelControls).forEach((control) => {
      if (!control.value) {
        control.disable({ emitEvent: false, onlySelf: true });
      }
    });
    Object.values(this.externalModelControls).forEach((control) => {
      if (!control.value) {
        control.disable({ emitEvent: false, onlySelf: true });
      }
    });
    Object.values(this.stageOnlyModelControls).forEach((control) => {
      if (!control.value) {
        control.disable({ emitEvent: false, onlySelf: true });
      }
    });
  }
  private enableAllModels() {
    this.form.enable({ emitEvent: false, onlySelf: true });
  }
}
