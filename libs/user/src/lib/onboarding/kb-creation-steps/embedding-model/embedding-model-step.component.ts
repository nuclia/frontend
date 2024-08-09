import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EmbeddingModelForm, EmbeddingsModelFormComponent } from '../../embeddings-model-form';
import { StickyFooterComponent } from '@nuclia/sistema';

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
  @Input() data?: EmbeddingModelForm;
  @Input() isLastStep = true;

  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<EmbeddingModelForm>();

  model?: EmbeddingModelForm;

  updateModel(model: EmbeddingModelForm) {
    this.model = model;
  }

  goBack() {
    this.back.emit();
  }

  submitForm() {
    this.next.emit(this.model);
  }
}
