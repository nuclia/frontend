import { ActivatedRoute, Router } from '@angular/router';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { AccountSummary } from '../../models/account.model';
import { MatSort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { of as observableOf } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListComponent implements AfterViewInit {
  displayedColumns: string[] = ['id', 'title', 'slug', 'type', 'actions'];
  accounts: MatTableDataSource<AccountSummary> | undefined;

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.data.subscribe((data) => {
      this.accounts = new MatTableDataSource(data.accounts);
      this.cdr.detectChanges();
    });
  }

  applyFilter(filterValue: string) {
    this.accounts!.filter = filterValue.trim().toLowerCase();

    if (this.accounts?.paginator) {
      this.accounts.paginator.firstPage();
    }
    this.cdr.detectChanges();
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.sort.sortChange
        .pipe(
          startWith({}),
          switchMap(() => {
            this.isLoadingResults = true;
            return this.accountService.getAccounts();
          }),
          map((data) => {
            // Flip flag to show that loading has finished.
            this.isLoadingResults = false;
            this.isRateLimitReached = false;
            this.resultsLength = data.length;

            return data;
          }),
          catchError(() => {
            this.isLoadingResults = false;
            // Catch if the GitHub API has reached its rate limit. Return empty data.
            this.isRateLimitReached = true;
            return observableOf([] as AccountSummary[]);
          }),
        )
        .subscribe((data) => {
          this.accounts = new MatTableDataSource(data);
          this.cdr.detectChanges();
        });
    }
  }

  addNewAccount() {
    this.router.navigate(['/accounts/new']);
  }

  delete(row: any) {
    if (confirm('Are you sure?')) {
      this.accountService.deleteAccount(row.id).subscribe({
        next: () => {
          alert('Done');
          this.refresh();
        },
        error: (error) => console.log(error),
      });
    }
  }

  refresh() {
    this.accountService.getAccounts().subscribe((res) => {
      this.accounts = new MatTableDataSource(res);
      this.cdr.detectChanges();
    });
  }

  edit(row: any) {
    this.router.navigate(['/accounts/' + row.id]);
  }
}
