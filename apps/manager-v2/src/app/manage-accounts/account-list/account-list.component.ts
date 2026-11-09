import { AsyncPipe, DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAddRound, matDeleteRound } from '@ng-icons/material-icons/round';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { UiInfiniteScrollImports } from '@nuclia/ui/infinite-scroll';
import { BehaviorSubject, combineLatest, filter, map, Observable, switchMap, tap } from 'rxjs';
import { ManagerStore } from '../../manager.store';
import { AccountSummary } from '../account-ui.models';
import { AccountService } from '../account.service';

@Component({
  templateUrl: './account-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    DatePipe,
    HlmButtonImports,
    HlmInputImports,
    HlmTableImports,
    NgIcon,
    RouterLink,
    SlicePipe,
    UiInfiniteScrollImports,
  ],
  providers: [provideIcons({ matAddRound, matDeleteRound })],
})
export class AccountListComponent {
  private _allAccounts: BehaviorSubject<AccountSummary[]> = new BehaviorSubject<AccountSummary[]>([]);
  private store = inject(ManagerStore);
  canDelete = this.store.canDeleteAccount;
  canCreateAccount = this.store.canCreateAccount;
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
              account.type.includes(filter) ||
              account.workflow.includes(filter),
          )
        : accounts,
    ),
    map((accounts) => accounts.sort((a, b) => `${a.type}-${a.title}`.localeCompare(`${b.type}-${b.title}`))),
  );

  lastIndex = 100;

  constructor(
    private accountService: AccountService,
    private confirmService: UiConfirmService,
    private toast: UiToastService,
  ) {
    this.loadAccounts().subscribe();
  }

  onFilterInput(event: Event) {
    this.filter$.next((event.target as HTMLInputElement).value);
  }

  onReachAnchor() {
    if (this.lastIndex < this._allAccounts.getValue().length) {
      this.lastIndex = this.lastIndex + 100;
    }
  }

  deleteAccount(event: MouseEvent, account: AccountSummary) {
    event.preventDefault();
    event.stopPropagation();
    this.confirmService
      .confirm({
        title: `Are you sure you want to delete "${account.slug}"?`,
        description: `You’re about to delete "${account.title}" (${account.slug})?`,
        isDestructive: true,
        cancelLabel: 'Cancel',
        confirmLabel: 'Delete',
      })
      .pipe(
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
