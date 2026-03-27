import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  BackendConfigurationService,
  BillingService,
  FeaturesService,
  NavigationService,
  SDKService,
} from '@flaps/core';
import { combineLatest, filter, map, merge, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { StandaloneService } from '../services';

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
  inArag = this.navigationService.inArag();
  inAccount: Observable<boolean> = this.navigationService.inAccount.pipe(takeUntil(this.unsubscribeAll));
  inDashboard = this.navigationService.inDashboard;
  inRaoApp = this.navigationService.inRaoApp;
  inPlatformApp = this.navigationService.inPlatformApp;
  inKbSettings: Observable<boolean> = this.properKbId.pipe(
    switchMap((kbUrl) =>
      merge(
        of(
          this.navigationService.inKbSettings(this.standalone ? location.hash : location.pathname, kbUrl) &&
            !this.isOnMetricsPage(location.pathname),
        ),
        this.router.events.pipe(
          filter((event) => event instanceof NavigationEnd),
          map(
            (event) =>
              this.navigationService.inKbSettings((event as NavigationEnd).url, kbUrl) &&
              !this.isOnMetricsPage((event as NavigationEnd).url),
          ),
          takeUntil(this.unsubscribeAll),
        ),
      ),
    ),
  );
  inAragSettings: Observable<boolean> = combineLatest([this.sdk.currentAccount, this.sdk.currentArag]).pipe(
    map(([account, agent]) => this.navigationService.getRetrievalAgentUrl(account.slug, agent.slug)),
    switchMap((aragUrl) =>
      merge(
        of(this.navigationService.inAragSettings(location.pathname, aragUrl)),
        this.router.events.pipe(
          filter((event) => event instanceof NavigationEnd),
          map((event) => this.navigationService.inAragSettings((event as NavigationEnd).url, aragUrl)),
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
  showMetrics = false;
  kbUrl: string = '';
  aragUrl: string = '';
  platformUrl: string = '';

  account = this.sdk.currentAccount;
  kb = this.sdk.currentKb;
  accountUrl = this.account.pipe(map((account) => this.navigationService.getAccountManageUrl(account!.slug)));

  isAdminOrContrib = this.features.isKbAdminOrContrib;
  isKbAdmin = this.features.isKbAdmin;
  isAragAdmin = this.features.isAragAdmin;
  isAccountManager = this.features.isAccountManager;
  isBillingEnabled = this.features.unstable.billing;
  noStripe = this.backendConfig.noStripe();
  isSynonymsEnabled = this.features.unstable.synonyms;
  isRemiMetricsEnabled = this.features.authorized.remiMetrics;
  isMetricsEnabled = this.features.unstable.metrics;
  isRetrievalAgentsEnabled = this.features.unstable.retrievalAgents;
  isModelManagementEnabled = this.features.unstable.modelManagement;
  isRaoWidgetEnabled = this.features.unstable.raoWidget;
  isAragWithMemory = this.sdk.isAragWithMemory;

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
    this.sdk.currentAccount
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((account) => (this.platformUrl = this.navigationService.getPlatformUrl(account.slug)));
    combineLatest([this.sdk.currentAccount, this.sdk.currentKb])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([account, kb]) => {
        const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
        this.kbUrl = this.navigationService.getKbUrl(account.slug, kbSlug);
        this.cdr.markForCheck();
      });

    combineLatest([this.sdk.currentAccount, this.sdk.currentArag])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(
        ([account, arag]) => (this.aragUrl = this.navigationService.getRetrievalAgentUrl(account.slug, arag.slug)),
      );
    this.inKbSettings
      .pipe(
        filter((inSettings) => inSettings),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((inSettings) => {
        this.showSettings = inSettings;
        this.cdr.markForCheck();
      });
    this.inAragSettings
      .pipe(
        filter((inSettings) => inSettings),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((inSettings) => {
        this.showSettings = inSettings;
        this.cdr.markForCheck();
      });

    merge(
      of(this.isOnMetricsPage(location.pathname)),
      this.router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => this.isOnMetricsPage((event as NavigationEnd).url)),
        takeUntil(this.unsubscribeAll),
      ),
    )
      .pipe(
        filter((inMetrics) => inMetrics),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.showMetrics = true;
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

  toggleMetrics() {
    this.showMetrics = !this.showMetrics;
    this.cdr.markForCheck();
  }

  private isOnMetricsPage(path: string): boolean {
    return /\/metrics\/(remi-analytics|usage-analytics|cost-token-usage|resource-activity|search-activity)/.test(path);
  }
}
