import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { AccountService } from '../account.service';
import { ActivatedRoute } from '@angular/router';
import { filter, Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ManagerStore } from '../../manager.store';
import { BackendConfigurationService } from '@flaps/core';

@Component({
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  account = this.store.accountDetails;
  kbList = this.store.kbList;
  currentState = this.store.currentState;
  noStripe = this.backendConfig.noStripe();

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private store: ManagerStore,
    private backendConfig: BackendConfigurationService,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        filter((params) => !!params['accountId']),
        switchMap((params) => this.accountService.loadAccountDetails(params['accountId'])),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  resetAccount() {
    this.store.setAccountDetails(null);
  }
}
