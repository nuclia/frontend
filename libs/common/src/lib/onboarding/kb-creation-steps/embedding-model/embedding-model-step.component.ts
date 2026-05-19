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

import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EmbeddingsModelFormComponent, LearningConfigurationForm } from '../../embeddings-model-form';
import { StickyFooterComponent } from '@nuclia/sistema';
import { LearningConfigurationOption, LearningConfigurations } from '@nuclia/core';
import { Subject, takeUntil } from 'rxjs';

const COWORK_MODELS = ['MULTILINGUAL', 'ENGLISH'];

@Component({
  selector: 'nus-embedding-model-step',
  imports: [
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    EmbeddingsModelFormComponent,
    PaTextFieldModule,
    StickyFooterComponent,
  ],
  templateUrl: './embedding-model-step.component.html',
  styleUrls: ['../../_common-step.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbeddingModelStepComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) schema: LearningConfigurations | null = null;
  @Input() data?: LearningConfigurationForm;
  @Input() isLastStep = true;
  @Input({ transform: booleanAttribute }) cowork = false;

  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<LearningConfigurationForm>();

  learningConfig?: LearningConfigurationForm;
  coworkModelControl = new FormControl<string>('', { nonNullable: true });
  coworkOptions: LearningConfigurationOption[] = [];

  private unsubscribeAll = new Subject<void>();

  ngOnInit() {
    if (this.cowork) {
      this.coworkModelControl.valueChanges
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe((value) => this.applyCoworkSelection(value));
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['schema'] && this.schema && this.cowork) {
      const allOptions = this.schema['semantic_model']?.options ?? [];
      this.coworkOptions = COWORK_MODELS.map((name) => allOptions.find((o) => o.name === name)).filter(
        (o): o is LearningConfigurationOption => !!o,
      );

      const defaultOption = this.coworkOptions[0];
      if (defaultOption) {
        this.coworkModelControl.setValue(defaultOption.value);
        this.applyCoworkSelection(defaultOption.value);
      }
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateModel(config: LearningConfigurationForm) {
    this.learningConfig = config;
  }

  goBack() {
    this.back.emit();
  }

  submitForm() {
    this.next.emit(this.learningConfig);
  }

  private applyCoworkSelection(optionValue: string) {
    this.learningConfig = { semantic_models: [optionValue] };
  }
}
