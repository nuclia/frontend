import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ResourceTableComponent } from './resource-table.component';

@Component({
  templateUrl: './resource-table-modal.component.html',
  styleUrl: './resource-table-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaModalModule, TranslatePipe, ResourceTableComponent],
})
export class ResourceTableModalComponent {
  // ModalService.closeModal() looks up open modals via `instance.modal`; without this property
  // it can never find/remove this component from its internal list, so the backdrop never closes.
  private modal = inject(ModalRef);
}
