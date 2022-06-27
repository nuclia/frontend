import { ActivatedRoute, Router } from '@angular/router';
import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { Dealer } from '../../models/dealer.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { merge, Observable, of as observableOf } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { DealerService } from '../../services/dealer.service';

@Component({
  selector: 'app-dealer-list',
  templateUrl: './dealer-list.component.html',
  styleUrls: ['./dealer-list.component.scss'],
})
export class DealerListComponent implements AfterViewInit {
  displayedColumns: string[] = ['id', 'actions'];
  dealers: MatTableDataSource<Dealer> | undefined;

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  message = 'Dealers list';

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;

  constructor(private route: ActivatedRoute, private router: Router, private dealerService: DealerService) {
    this.route.data.subscribe((data) => {
      this.dealers = new MatTableDataSource(data.users);
    });
  }

  applyFilter(filterValue: string) {
    this.dealers!.filter = filterValue.trim().toLowerCase();

    if (this.dealers!.paginator) {
      this.dealers!.paginator.firstPage();
    }
  }

  ngAfterViewInit() {
    const paginator = this.paginator;
    if (this.sort && paginator) {
      this.sort.sortChange.subscribe(() => (paginator.pageIndex = 0));

      merge(this.sort.sortChange, paginator.page)
        .pipe(
          startWith({}),
          switchMap(() => {
            this.isLoadingResults = true;
            return this.dealerService.getDealers();
            // this.sort.active, this.sort.direction, paginator.pageIndex);
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
            return observableOf([] as Dealer[]);
          }),
        )
        .subscribe((data) => (this.dealers = new MatTableDataSource(data)));
    }
  }

  addNewDealer() {
    this.router.navigate(['/dealers/new']);
  }

  delete(row: any) {
    this.dealerService.deleteDealer(row.id).subscribe(
      (res) => (this.message = 'Deleted'),
      (error) => console.log(error),
    );
  }

  edit(row: any) {
    this.router.navigate(['/dealers/' + row.id]);
  }
}
