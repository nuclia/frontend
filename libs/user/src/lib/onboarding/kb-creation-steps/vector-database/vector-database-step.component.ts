import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StickyFooterComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { VectorDatabaseFormComponent, VectorDbModel } from '../../vector-database-form';
import { ExternalIndexProvider } from '@nuclia/core';

@Component({
  selector: 'nus-vector-database-step',
  standalone: true,
  imports: [CommonModule, StickyFooterComponent, TranslateModule, PaButtonModule, VectorDatabaseFormComponent],
  templateUrl: './vector-database-step.component.html',
  styleUrls: ['../../_common-step.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VectorDatabaseStepComponent {
  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<ExternalIndexProvider | null>();

  vectorDbModel?: VectorDbModel;
  indexProvider: ExternalIndexProvider | null = null;

  goBack() {
    this.back.emit();
  }

  submitForm() {
    if (this.indexProvider) {
      this.next.emit(this.indexProvider);
    }
  }
}
