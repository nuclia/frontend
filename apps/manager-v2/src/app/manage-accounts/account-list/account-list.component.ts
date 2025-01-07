import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, switchMap, tap } from 'rxjs';
import { AccountSummary } from '../account-ui.models';
import { AccountService } from '../account.service';
import { SisModalService, SisToastService } from '@nuclia/sistema';

@Component({
  templateUrl: './account-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountListComponent {
  private _allAccounts: BehaviorSubject<AccountSummary[]> = new BehaviorSubject<AccountSummary[]>([]);

  filter$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  accounts$: Observable<AccountSummary[]> = combineLatest([this._allAccounts, this.filter$]).pipe(
    map(([accounts, filter]) =>
      filter
        ? accounts.filter(
            (account) =>
              account.id.includes(filter) ||
              account.title.includes(filter) ||
              account.slug.includes(filter) ||
              account.email.includes(filter) ||
              account.type.includes(filter),
          )
        : accounts,
    ),
    map((accounts) => accounts.sort((a, b) => `${a.type}-${a.title}`.localeCompare(`${b.type}-${b.title}`))),
  );

  lastIndex = 100;

  constructor(
    private accountService: AccountService,
    private modalService: SisModalService,
    private toast: SisToastService,
  ) {
    this.loadAccounts().subscribe();
  }

  onReachAnchor() {
    if (this.lastIndex < this._allAccounts.getValue().length) {
      this.lastIndex = this.lastIndex + 100;
    }
  }

  deleteAccount(event: MouseEvent, account: AccountSummary) {
    event.preventDefault();
    event.stopPropagation();
    this.modalService
      .openConfirm({
        title: `Are you sure you want to delete "${account.slug}"?`,
        description: `You’re about to delete "${account.title}" (${account.slug})?`,
        isDestructive: true,
        cancelLabel: 'Cancel',
        confirmLabel: 'Delete',
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.accountService.deleteAccount(account.id)),
        switchMap(() => this.loadAccounts()),
      )
      .subscribe({
        error: () => this.toast.error('Account deletion failed'),
      });
  }

  private loadAccounts(): Observable<AccountSummary[]> {
    return this.accountService.getAccounts().pipe(tap((accounts) => this._allAccounts.next(accounts)));
  }
}
