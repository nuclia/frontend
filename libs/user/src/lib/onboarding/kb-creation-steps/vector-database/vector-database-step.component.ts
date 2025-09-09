import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

import { StickyFooterComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { VectorDatabaseFormComponent, VectorDbModel } from '../../vector-database-form';
import { ExternalIndexProvider } from '@nuclia/core';

@Component({
  selector: 'nus-vector-database-step',
  imports: [StickyFooterComponent, TranslateModule, PaButtonModule, VectorDatabaseFormComponent],
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
    this.next.emit(this.indexProvider);
  }
}
