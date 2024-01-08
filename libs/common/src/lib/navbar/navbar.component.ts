import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, filter, map, merge, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { NavigationService, StandaloneService } from '../services';
import { BillingService, SDKService, STFTrackingService } from '@flaps/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  inAccount: Observable<boolean> = merge(
    of(this.navigationService.inAccountManagement(location.pathname)),
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => this.navigationService.inAccountManagement((event as NavigationEnd).url)),
      takeUntil(this.unsubscribeAll),
    ),
  );
  inSettings: Observable<boolean> = combineLatest([this.sdk.currentAccount, this.sdk.currentKb]).pipe(
    map(([account, kb]) => {
      return this.navigationService.getKbUrl(account.slug, kb.slug || '');
    }),
    switchMap((kbUrl) =>
      merge(
        of(this.navigationService.inKbSettings(location.pathname, kbUrl)),
        this.router.events.pipe(
          filter((event) => event instanceof NavigationEnd),
          map((event) => this.navigationService.inKbSettings((event as NavigationEnd).url, kbUrl)),
          takeUntil(this.unsubscribeAll),
        ),
      ),
    ),
  );
  inBilling: Observable<boolean> = merge(
    of(this.navigationService.inAccountBilling(location.pathname)),
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => this.navigationService.inAccountBilling((event as NavigationEnd).url)),
      takeUntil(this.unsubscribeAll),
    ),
  );
  showSettings = false;
  kbUrl: string = '';

  isAdminOrContrib = this.sdk.isAdminOrContrib;
  isAdmin = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || kb.accountId === 'local'));
  account = this.sdk.currentAccount;
  isTrial = this.account.pipe(map((account) => account?.type === 'stash-trial'));
  kb = this.sdk.currentKb;
  accountUrl = this.account.pipe(map((account) => this.navigationService.getAccountManageUrl(account!.slug)));
  isAccountManager = this.account.pipe(map((account) => account!.can_manage_account));

  isEntitiesEnabled = this.tracking.isFeatureEnabled('manage-entities');
  isBillingEnabled = this.tracking.isFeatureEnabled('billing');
  isTrainingEnabled = this.tracking.isFeatureEnabled('training');
  isSyncEnabled = this.tracking.isFeatureEnabled('sync');
  isSynonymsEnabled: Observable<boolean> = this.account
    .pipe(
      filter((account) => !!account),
      map((account) => account?.type),
    )
    .pipe(
      map(
        (accountType) =>
          !!accountType &&
          ['stash-growth', 'stash-startup', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(accountType),
      ),
    );

  standalone = this.sdk.nuclia.options.standalone;
  invalidKey = this.standaloneService.hasValidKey.pipe(map((hasValidKey) => this.standalone && !hasValidKey));
  isSubscribed = this.billing.isSubscribed;

  constructor(
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
    private sdk: SDKService,
    private router: Router,
    private navigationService: NavigationService,
    private standaloneService: StandaloneService,
    private billing: BillingService,
  ) {}

  ngOnInit(): void {
    combineLatest([this.sdk.currentAccount, this.sdk.currentKb])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([account, kb]) => {
        const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
        this.kbUrl = this.navigationService.getKbUrl(account.slug, kbSlug);
        this.cdr.markForCheck();
      });
    this.inSettings
      .pipe(
        filter((inSettings) => inSettings),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((inSettings) => {
        this.showSettings = inSettings;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
    this.cdr.markForCheck();
  }
}
