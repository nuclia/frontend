import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAddRound, matDeleteRound } from '@ng-icons/material-icons/round';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { UiInfiniteScroll } from '@nuclia/ui/infinite-scroll';
import { filter, Observable, switchMap, tap } from 'rxjs';
import { ManagerStore } from '../../manager.store';
import { AccountSummary } from '../account-ui.models';
import { AccountService } from '../account.service';

@Component({
  templateUrl: './account-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, HlmButtonImports, HlmInputImports, HlmTableImports, NgIcon, RouterLink, UiInfiniteScroll],
  providers: [provideIcons({ matAddRound, matDeleteRound })],
})
export class AccountListComponent {
  private accountService = inject(AccountService);
  private confirmService = inject(UiConfirmService);
  private store = inject(ManagerStore);

  private allAccounts = signal<AccountSummary[]>([]);
  private lastIndex = signal(100);

  canDelete = this.store.canDeleteAccount;
  canCreateAccount = this.store.canCreateAccount;
  filter = signal('');
  accounts = computed(() => {
    const filterValue = this.filter();
    const accounts = filterValue
      ? this.allAccounts().filter(
          (account) =>
            account.id.includes(filterValue) ||
            account.title.includes(filterValue) ||
            account.slug.includes(filterValue) ||
            account.email.includes(filterValue) ||
            account.type.includes(filterValue) ||
            account.workflow.includes(filterValue),
        )
      : this.allAccounts();
    return accounts
      .toSorted((a, b) => `${a.type}-${a.title}`.localeCompare(`${b.type}-${b.title}`))
      .slice(0, this.lastIndex());
  });

  constructor() {
    this.loadAccounts().subscribe();
  }

  onFilterInput(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  onReachAnchor() {
    if (this.lastIndex() < this.allAccounts().length) {
      this.lastIndex.update((index) => index + 100);
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
        error: () => toast.error('Account deletion failed'),
      });
  }

  private loadAccounts(): Observable<AccountSummary[]> {
    return this.accountService.getAccounts().pipe(tap((accounts) => this.allAccounts.set(accounts)));
  }
}
