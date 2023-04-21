import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AccountService } from '../account.service';
import { ActivatedRoute } from '@angular/router';
import { filter, Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExtendedAccount } from '../account.models';

@Component({
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  account?: ExtendedAccount;

  constructor(private route: ActivatedRoute, private accountService: AccountService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.route.params
      .pipe(
        filter((params) => !!params['id']),
        switchMap((params) => this.accountService.getAccount(params['id'])),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((account) => {
        this.account = account;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
