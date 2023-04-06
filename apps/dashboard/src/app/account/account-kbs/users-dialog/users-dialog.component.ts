import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { data } from '../../../../../../../libs/pastanaga-angular/projects/demo/src';

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

  protected readonly data = data;
}
