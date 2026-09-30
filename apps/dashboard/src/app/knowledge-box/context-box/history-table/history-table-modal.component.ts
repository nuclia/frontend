import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { HistoryTableComponent } from './history-table.component';

@Component({
  templateUrl: './history-table-modal.component.html',
  styleUrl: './history-table-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaModalModule, TranslatePipe, HistoryTableComponent],
})
export class HistoryTableModalComponent {
  private modal = inject(ModalRef);

  // Closes the modal with the selected resource id so the caller can open it in the search view.
  onOpenConversation(resourceId: string) {
    this.modal.close(resourceId);
  }
}
