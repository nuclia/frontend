import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, filter, map, merge, Observable, of, repeat, Subject, switchMap, takeUntil } from 'rxjs';
import { StandaloneService } from '../services';
import { BillingService, FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { NavigationEnd, Router } from '@angular/router';
import { SyncService } from '@nuclia/sync';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  inUpload: Observable<boolean> = this.properKbId.pipe(
    switchMap((kbUrl) =>
      merge(
        of(
          this.navigationService.inKbUpload(
            this.sdk.nuclia.options.standalone ? location.hash : location.pathname,
            kbUrl,
          ),
        ),
        this.router.events.pipe(
          filter((event) => event instanceof NavigationEnd),
          map((event) => this.navigationService.inKbUpload((event as NavigationEnd).url, kbUrl)),
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
  isEntitiesEnabled = this.features.manageEntities;
  isBillingEnabled = this.features.billing;
  isSynonymsEnabled = this.features.synonyms;
  isTasksAutomationEnabled = this.features.taskAutomation;
  isActivityEnabled = this.features.activityLog;
  isPromptLabEnabled = this.features.isEnterpriseOrGrowth.pipe(
    filter((isEnterprise) => isEnterprise),
    switchMap(() => this.features.promptLabEnabled),
  );

  standalone = this.standaloneService.standalone;
  invalidKey = this.standaloneService.hasValidKey.pipe(map((hasValidKey) => this.standalone && !hasValidKey));
  isSubscribed = this.billing.isSubscribedToStripe;
  syncs = of(null).pipe(
    repeat({ delay: () => this.router.events.pipe(filter((event) => event instanceof NavigationEnd)) }),
    switchMap(() => combineLatest([this.inUpload, this.isAdminOrContrib, this.invalidKey])),
    filter(([inUpload, isAdminOrContrib, invalidKey]) => inUpload && isAdminOrContrib && !invalidKey),
    switchMap(() => this.sdk.currentKb),
    switchMap((kb) => this.syncService.getSyncsForKB(kb.id)),
    map((syncs) =>
      syncs.map((sync) => ({ ...sync, logo: this.syncService.connectors[sync.connectorId].definition.logo })),
    ),
  );

  constructor(
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
    private sdk: SDKService,
    private router: Router,
    private navigationService: NavigationService,
    private standaloneService: StandaloneService,
    private billing: BillingService,
    private syncService: SyncService,
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
