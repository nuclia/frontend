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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

export interface LearningConfigurationForm {
  semantic_models: string[];
  user_keys?: { [key: string]: unknown };
}

@Component({
  selector: 'nus-embeddings-model-form',
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
  private translate = inject(TranslateService);
  private features = inject(FeaturesService);

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
      this.externalModels = [];
      this.semanticModels = (schema['semantic_models']?.options || []).reduce(
        (modelMap, model) => {
          if (!huggingFaceEnabled && model.name === this.HUGGING_FACE_MODEL) {
            return modelMap;
          }
          modelMap[model.name] = model.value;
          if (!this.nucliaModels.includes(model.name) && !this.stageOnlyModels.includes(model.name)) {
            // Currently schema endpoint on NucliaDB Admin doesn't support user_keys, so we can't provide HuggingFace
            if (model.name !== this.HUGGING_FACE_MODEL || !this.standalone) {
              this.externalModels.push(model.name);
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
        .subscribe(() => this.sendSelection());
    }
  }

  @Output() learningConfiguration = new EventEmitter<LearningConfigurationForm>();

  @ViewChild('externalModelsContainer', { read: AccordionItemComponent })
  externalModelsContainer?: AccordionItemComponent;

  nucliaModels = ['ENGLISH', 'MULTILINGUAL', 'MULTILINGUAL_ALPHA', 'MULTILINGUAL_BETA'];
  stageOnlyModels = ['MULTILINGUAL_EXTRA'];
  externalModels: string[] = [];

  selectedModel = new FormControl<string>('MULTILINGUAL', { nonNullable: true, validators: [Validators.required] });

  semanticModels: { [modelName: string]: string } = {};

  readonly HUGGING_FACE_MODEL = 'HF';

  huggingFaceForm?: FormGroup;
  huggingFaceRequiredFields: { key: string; value: LearningConfigurationProperty }[] = [];
  huggingFaceOptionalFields: { key: string; value: LearningConfigurationProperty }[] = [];

  isExtraSemanticModelEnabled = this.features.unstable.extraSemanticModel;
  isHuggingFaceSemanticModelEnabled = this.features.authorized.huggingFaceSemanticModel;

  get isHuggingFaceSelected() {
    return this.selectedModel.value === this.HUGGING_FACE_MODEL;
  }

  ngOnInit() {
    this.sendSelection();
    this.selectedModel?.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.sendSelection();
      this.updateExternalAccordionHeight();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['disabled']) {
      if (changes['disabled'].currentValue) {
        this.selectedModel.disable();
      } else {
        this.selectedModel.enable();
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
    const selected = this.selectedModel.value;
    let userKeys;
    if (selected === this.HUGGING_FACE_MODEL) {
      const extraFields = this.huggingFaceForm?.getRawValue();

      // Matryoshka is supposed to be an array of integers, but it's hard to make it a generic dynamical field with the current schema,
      // so we just format matryoshka field statically afterward
      if (typeof extraFields['matryoshka'] === 'string') {
        extraFields['matryoshka'] = extraFields['matryoshka']
          .split(',')
          .filter((value) => !!value.trim())
          .map((value) => Number.parseInt(value, 10));
      }
      userKeys = {
        hf_embedding: extraFields,
      };
    }

    this.learningConfiguration.emit({
      semantic_models: getSemanticModels([selected], this.learningSchema),
      user_keys: userKeys,
    });
  }
}
