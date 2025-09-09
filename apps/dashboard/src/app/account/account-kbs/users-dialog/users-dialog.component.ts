import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

@Component({
  templateUrl: './users-dialog.component.html',
  styleUrls: ['./users-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UsersDialogComponent {
  kb = this.modal.config.data?.['kb'];
  constructor(public modal: ModalRef) {}

  close() {
    this.modal.close();
  }
}
