import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PaButtonModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { LearningConfigurationOption, LearningConfigurations } from '@nuclia/core';
import { StickyFooterComponent } from '@nuclia/sistema';
import { LearningConfigurationForm } from '../../embeddings-model-form';

const MODELS = ['MULTILINGUAL', 'ENGLISH', 'MULTILINGUAL_ALPHA'];
const DEFAULT_MODEL = 'MULTILINGUAL';

@Component({
  selector: 'nus-embedding-model-step',
  imports: [
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslatePipe,
    PaPopupModule,
    PaTextFieldModule,
    StickyFooterComponent,
  ],
  templateUrl: './embedding-model-step.component.html',
  styleUrls: ['../../_common-step.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbeddingModelStepComponent implements OnChanges {
  @Input({ required: true }) schema: LearningConfigurations | null = null;
  @Input() data?: LearningConfigurationForm;
  @Input() isLastStep = true;

  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<LearningConfigurationForm>();

  modelControl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  options: LearningConfigurationOption[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['schema'] && this.schema) {
      const allOptions = this.schema['semantic_model']?.options ?? [];
      this.options = MODELS.map((name) => allOptions.find((o) => o.name === name)).filter(
        (o): o is LearningConfigurationOption => !!o,
      );
      const defaultOption = this.options.find((o) => o.name === DEFAULT_MODEL);
      if (defaultOption) {
        this.modelControl.setValue(defaultOption.value);
      }
    }
  }

  goBack() {
    this.back.emit();
  }

  submitForm() {
    this.next.emit({ semantic_models: [this.modelControl.value] });
  }
}
