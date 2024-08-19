import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EmbeddingsModelFormComponent, LearningConfigurationForm } from '../../embeddings-model-form';
import { StickyFooterComponent } from '@nuclia/sistema';
import { LearningConfigurations } from '@nuclia/core';

@Component({
  selector: 'nus-embedding-model-step',
  standalone: true,
  imports: [
    CommonModule,
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    EmbeddingsModelFormComponent,
    PaTextFieldModule,
    StickyFooterComponent,
    PaButtonModule,
  ],
  templateUrl: './embedding-model-step.component.html',
  styleUrls: ['../../_common-step.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbeddingModelStepComponent {
  @Input({ required: true }) schema: LearningConfigurations | null = null;
  @Input() data?: LearningConfigurationForm;
  @Input() isLastStep = true;

  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<LearningConfigurationForm>();

  learningConfig?: LearningConfigurationForm;

  updateModel(config: LearningConfigurationForm) {
    this.learningConfig = config;
  }

  goBack() {
    this.back.emit();
  }

  submitForm() {
    this.next.emit(this.learningConfig);
  }
}
