import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { StateService } from '@flaps/core';
import { filter } from 'rxjs';
import { Account } from '@nuclia/core';

@Component({
  selector: 'app-account-delete',
  templateUrl: './account-delete.component.html',
  styleUrls: ['./account-delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDeleteComponent {
  deleteAccount = true;
  deleteUser?: string = undefined;
  account = this.stateService.account.pipe(filter((account): account is Account => !!account));
  showDeleteUser = !!this.modal.config.data?.showDeleteUser;

  constructor(private modal: ModalRef, private stateService: StateService) {}
}
