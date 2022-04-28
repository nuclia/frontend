import { ActivatedRoute, Router } from '@angular/router';
import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { AccountSummary } from '../../models/account.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { merge, Observable, of as observableOf } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss'],
})
export class AccountListComponent implements AfterViewInit {
  displayedColumns: string[] = ['id', 'title', 'slug', 'type', 'actions'];
  accounts: MatTableDataSource<AccountSummary> | undefined;

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
  ) {
    this.route.data.subscribe((data) => {
      this.accounts = new MatTableDataSource(data.accounts);
    });
  }

  applyFilter(filterValue: string) {
    this.accounts!.filter = filterValue.trim().toLowerCase();

    if (this.accounts?.paginator) {
      this.accounts.paginator.firstPage();
    }
  }

  ngAfterViewInit() {
    this.sort!.sortChange.subscribe(() => (this.paginator!.pageIndex = 0));

    merge(this.sort!.sortChange, this.paginator!.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.accountService.getAccounts();
          // this.sort.active, this.sort.direction, this.paginator.pageIndex);
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
          return observableOf([]);
        })
      )
      .subscribe((data) => (this.accounts = new MatTableDataSource(data)));
  }

  addNewAccount() {
    this.router.navigate(['/accounts/new']);
  }

  delete(row: any) {
    if (confirm('Are you sure?')) {
      this.accountService.deleteAccount(row.id).subscribe(
        (res) => {
          alert('Done');
          this.refresh();
        },
        (error) => console.log(error)
      );
    }
  }

  refresh() {
    this.accountService.getAccounts().subscribe((res) => {
      this.accounts = new MatTableDataSource(res);
    });
  }

  edit(row: any) {
    this.router.navigate(['/accounts/' + row.id]);
  }
}
