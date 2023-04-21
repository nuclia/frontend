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

  account = this.accountStore.accountDetails;
  currentState = this.accountStore.currentState;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private accountStore: AccountDetailsStore,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        filter((params) => !!params['id']),
        switchMap((params) => this.accountService.getAccount(params['id'])),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((account) => this.accountStore.setAccountDetails(account));

    this.accountService.getZones().subscribe((zones) => this.accountStore.setZones(zones));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
