import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UsersManageComponent, UsersManageService } from '@flaps/common';
import { ModalRef, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  templateUrl: './users-dialog.component.html',
  styleUrls: ['./users-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersManageService],
  imports: [PaModalModule, UsersManageComponent, TranslatePipe],
})
export class UsersDialogComponent {
  kb = this.modal.config.data?.['kb'];
  constructor(public modal: ModalRef) {}

  close() {
    this.modal.close();
  }
}
