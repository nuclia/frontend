import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AccountSummary } from '../../models/account.model';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { AccountService } from '../../services/account.service';
import { concatMap } from 'rxjs';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListComponent {
  displayedColumns: string[] = ['id', 'title', 'slug', 'type', 'actions'];
  private _accounts: AccountSummary[] = [];
  accounts: MatTableDataSource<AccountSummary> | undefined;
  filter = '';

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.data.subscribe((data) => {
      this._accounts = data.accounts;
      this.renderAccounts();
    });
  }

  private renderAccounts() {
    if (!this.filter || this.filter.length < 2) {
      this.accounts = new MatTableDataSource([] as AccountSummary[]);
    } else {
      this.accounts = new MatTableDataSource(
        this._accounts.filter((account) => this.isMatching(account)).slice(0, 100),
      );
      if (this.accounts?.paginator) {
        this.accounts.paginator.firstPage();
      }
    }
    this.isLoadingResults = false;
    this.cdr.detectChanges();
  }

  applyFilter(filterValue: string) {
    this.filter = filterValue.trim().toLowerCase();
    this.renderAccounts();
  }

  addNewAccount() {
    this.router.navigate(['/accounts/new']);
  }

  delete(row: any) {
    if (confirm('Are you sure?')) {
      this.isLoadingResults = true;
      this.accountService
        .deleteAccount(row.id)
        .pipe(concatMap(() => this.accountService.getAccounts()))
        .subscribe({
          next: (res) => {
            alert('Done');
            this._accounts = res;
            this.renderAccounts();
          },
          error: (error) => console.log(error),
        });
    }
  }

  edit(row: any) {
    this.router.navigate(['/accounts/' + row.id]);
  }

  private isMatching(account: AccountSummary): boolean {
    return (
      account.id.toLocaleLowerCase().includes(this.filter) ||
      account.title.toLocaleLowerCase().includes(this.filter) ||
      account.slug.toLocaleLowerCase().includes(this.filter) ||
      account.type.toLocaleLowerCase().includes(this.filter)
    );
  }
}
