import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UserSearch } from '../../models/user.model';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { Observable, of as observableOf, Subject } from 'rxjs';
import { takeUntil, tap, filter, switchMap, auditTime, distinctUntilChanged } from 'rxjs/operators';
import { UsersService } from '../../services/users.service';

const MIN_TERM_LENGTH = 3;

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'email', 'provider', 'actions'];

  users: MatTableDataSource<UserSearch> | undefined;

  resultsLength: number = 0;
  isLoadingResults = false;
  searchTerm: string = '';

  search = new Subject<string>();
  unsubscribeAll = new Subject<void>();

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;

  constructor(private router: Router, private usersService: UsersService) {}

  ngOnInit() {
    this.search
      .pipe(
        filter((term) => term.length == 0 || term.length >= MIN_TERM_LENGTH),
        auditTime(300),
        distinctUntilChanged(),
        tap((term) => {
          this.isLoadingResults = true;
          this.searchTerm = term;
        }),
        switchMap((term) => this.doSearch(term)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((users: UserSearch[]) => {
        this.users = new MatTableDataSource(users);
        this.resultsLength = users.length;
        this.isLoadingResults = false;

        if (this.users!.paginator) {
          this.users!.paginator.firstPage();
        }
      });
  }

  applyFilter(filterValue: string) {
    this.search.next(filterValue.trim());
  }

  doSearch(term: string): Observable<UserSearch[]> {
    return this.usersService.searchUser(term);
  }

  go(row: any) {
    this.router.navigate(['/users/' + row.id]);
  }

  addNewUser() {
    this.router.navigate(['/users/+new']);
  }

  ngOnDestroy() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }
}
