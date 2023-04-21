import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, switchMap } from 'rxjs';
import { AccountSummary } from '../account.models';
import { AccountService } from '../account.service';
import { SisModalService, SisToastService } from '@nuclia/sistema';

@Component({
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListComponent {
  private _allAccounts: BehaviorSubject<AccountSummary[]> = new BehaviorSubject<AccountSummary[]>([]);

  filter$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  accounts$: Observable<AccountSummary[]> = combineLatest([this._allAccounts, this.filter$]).pipe(
    map(([accounts, filter]) =>
      filter ? accounts.filter((account) => account.title.includes(filter) || account.slug.includes(filter)) : accounts,
    ),
  );

  constructor(
    private accountService: AccountService,
    private modalService: SisModalService,
    private toast: SisToastService,
  ) {
    this.loadAccounts();
  }

  deleteAccount(account: AccountSummary) {
    this.modalService
      .openConfirm({
        title: `Are you sure you want to delete "${account.slug}"?`,
        description: `You’re about to delete "${account.title}" (${account.slug})?`,
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => confirm),
        switchMap(() => this.accountService.deleteAccount(account.id)),
      )
      .subscribe({
        next: () => this.loadAccounts(),
        error: () => this.toast.error('Account deletion failed'),
      });
  }

  private loadAccounts() {
    this.accountService.getAccounts().subscribe((accounts) => this._allAccounts.next(accounts));
  }
}
