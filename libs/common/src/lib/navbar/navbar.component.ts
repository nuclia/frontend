import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, filter, map, merge, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { StandaloneService } from '../services';
import {
  BackendConfigurationService,
  BillingService,
  FeaturesService,
  NavigationService,
  SDKService,
} from '@flaps/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class NavbarComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  properKbId = combineLatest([this.sdk.currentAccount, this.sdk.currentKb]).pipe(
    map(([account, kb]) => {
      return this.navigationService.getKbUrl(account.slug, this.standalone ? kb.id : kb.slug || kb.id);
    }),
  );
  inAccount: Observable<boolean> = merge(
    of(this.navigationService.inAccountManagement(location.pathname)),
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => this.navigationService.inAccountManagement((event as NavigationEnd).url)),
      takeUntil(this.unsubscribeAll),
    ),
  );
  inSettings: Observable<boolean> = this.properKbId.pipe(
    switchMap((kbUrl) =>
      merge(
        of(this.navigationService.inKbSettings(this.standalone ? location.hash : location.pathname, kbUrl)),
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

  account = this.sdk.currentAccount;
  kb = this.sdk.currentKb;
  accountUrl = this.account.pipe(map((account) => this.navigationService.getAccountManageUrl(account!.slug)));

  isAdminOrContrib = this.features.isKbAdminOrContrib;
  isKbAdmin = this.features.isKbAdmin;
  isTrial = this.features.isTrial;
  isAccountManager = this.features.isAccountManager;
  isBillingEnabled = this.features.unstable.billing;
  noStripe = this.backendConfig.noStripe();
  isTasksAutomationAuthorized = this.features.authorized.taskAutomation;
  isSynonymsEnabled = this.features.unstable.synonyms;
  isRemiMetricsEnabled = this.features.unstable.remiMetrics;

  isActivityAuthorized = this.features.authorized.activityLog;
  isPromptLabAuthorized = this.features.authorized.promptLab;

  standalone = this.standaloneService.standalone;
  invalidKey = this.standaloneService.hasValidKey.pipe(map((hasValidKey) => this.standalone && !hasValidKey));
  isSubscribed = this.billing.isSubscribedToStripe;

  constructor(
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
    private sdk: SDKService,
    private router: Router,
    private navigationService: NavigationService,
    private standaloneService: StandaloneService,
    private billing: BillingService,
    private backendConfig: BackendConfigurationService,
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
