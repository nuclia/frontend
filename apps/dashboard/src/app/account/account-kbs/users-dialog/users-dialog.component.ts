import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

@Component({
  templateUrl: './users-dialog.component.html',
  styleUrls: ['./users-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersDialogComponent {
  constructor(public modal: ModalRef) {}

  close() {
    this.modal.close();
  }
}
