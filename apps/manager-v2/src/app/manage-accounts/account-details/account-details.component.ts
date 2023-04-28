import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { AccountService } from '../account.service';
import { ActivatedRoute } from '@angular/router';
import { filter, Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountDetailsStore } from './account-details.store';

@Component({
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  account = this.store.accountDetails;
  currentState = this.store.currentState;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private store: AccountDetailsStore,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        filter((params) => !!params['accountId']),
        switchMap((params) => this.accountService.getAccount(params['accountId'])),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((account) => this.store.setAccountDetails(account));

    this.accountService.getZones().subscribe((zones) => this.store.setZones(zones));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  resetAccount() {
    this.store.resetAccountDetails();
  }
}
