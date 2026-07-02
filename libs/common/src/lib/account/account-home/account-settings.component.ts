import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendConfigurationService, FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { UsagePoint, UsageType } from '@nuclia/core';
import { combineLatest, filter, fromEvent, forkJoin, map, ReplaySubject, shareReplay, startWith, Subject, switchMap, take, takeUntil, Observable } from 'rxjs';
import { MetricsService } from '../metrics.service';

type AccountSettingsTab = 'consumption' | 'subscriptions' | 'preferences' | 'account-settings';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountSettingsComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedTab: AccountSettingsTab = 'consumption';
  unsubscribeAll = new Subject<void>();
  account$ = this.metrics.account$;
  isTrial = this.features.isTrial;
  isAccountManager = this.features.isAccountManager;
  isCowork = this.sdk.currentAccount.pipe(
    map((account) => account.workflow === 'cowork'),
    shareReplay(1),
  );
  isBillingEnabled = this.features.unstable.billing;
  noStripe = this.backendConfig.noStripe();
  // Compute the back-link target from the active KB.  When no KB is in context
  // (e.g. the user loaded manage/home directly), fall back to the KB-select page
  // for this account so clicking "Back" always lands somewhere meaningful.
  backLink = combineLatest([
    this.sdk.currentAccount,
    this.sdk.currentKb.pipe(startWith(null)),
  ]).pipe(
    map(([account, kb]) => {
      const kbSlug = kb && (this.sdk.nuclia.options.standalone ? kb.id : kb.slug);
      return kbSlug
        ? this.navigation.getKbUrl(account.slug, kbSlug as string)
        : this.navigation.getKbSelectUrl(account.slug);
    }),
    shareReplay(1),
  );
  selectedPeriod = new ReplaySubject<{ start: Date; end: Date }>(1);

  usage?: { [key: string]: UsagePoint[] };
  tokensCount?: { [key: string]: number };
  
  // Knowledge Boxes and query statistics for consumption summary
  kbs = this.sdk.kbList;
  totalQueries = this.metrics.getUsageCount(UsageType.SEARCHES_PERFORMED);

  showSubscriptionsTab = combineLatest([this.isBillingEnabled, this.isAccountManager]).pipe(
    map(([billing, isManager]) => !!billing && !!isManager && !this.noStripe),
    shareReplay(1),
  );

  showAccountSettingsTab = combineLatest([this.isAccountManager, this.isCowork]).pipe(
    map(([isManager, isCowork]) => !!isManager && !isCowork),
    shareReplay(1),
  );

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
    private metrics: MetricsService,
    private features: FeaturesService,
    private route: ActivatedRoute,
    private backendConfig: BackendConfigurationService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.getUsageMap()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((usage) => {
        this.usage = usage;
        // Compute token counts per KB from usage data
        this.tokensCount = Object.entries(usage).reduce(
          (acc, [key, value]) => {
            if (key !== 'account') {
              acc[key] = value[0]?.metrics?.find((metric) => metric.name === 'nuclia_tokens_billed')?.value || 0;
            }
            return acc;
          },
          {} as { [key: string]: number },
        );
        this.cdr.markForCheck();
      });

    this.metrics.period.pipe(take(1)).subscribe((period) => {
      this.selectedPeriod.next(period);
    });

    // Keep listening to query params for the lifetime of the component so that
    // re-navigating to a different tab from the dropdown (while already on the
    // shell) correctly updates the selected tab.
    this.route.queryParams.pipe(takeUntil(this.unsubscribeAll)).subscribe((params) => {
      const tab = params['tab'] as string | undefined;
      const action = params['action'] as string | undefined;
      if (tab === 'knowledge-boxes' || tab === 'users') {
        this.account$.pipe(take(1)).subscribe((account) => {
          this.router.navigate([`${this.navigation.getAccountManageUrl(account.slug)}/administration`], {
            queryParams: action ? { tab, action } : { tab },
            replaceUrl: true,
          });
        });
        return;
      }
      const validTabs: AccountSettingsTab[] = [
        'consumption',
        'subscriptions',
        'preferences',
        'account-settings',
      ];
      if (tab && validTabs.includes(tab as AccountSettingsTab)) {
        this.selectedTab = tab as AccountSettingsTab;
        this.cdr.markForCheck();
      } else if (!tab) {
        // No tab param — default to consumption.
        this.selectedTab = 'consumption';
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewInit(): void {
    // When navigating to account settings via SPA (from a page that had the sidebar
    // visible), the .dashboard-content width transitions over ~0.8s to full-width.
    // pa-tabs captures _xPosition in ngAfterContentInit (< 1 tick), which is
    // mid-animation and therefore wrong.  Dispatching a resize event after the
    // transition ends forces pa-tabs to recapture the correct position.
    const content = document.querySelector('.dashboard-content');
    if (content) {
      fromEvent<TransitionEvent>(content, 'transitionend')
        .pipe(
          // Guard against bubbled transitionend events from child elements — only
          // react when the .dashboard-content element itself finishes its width animation.
          filter((e) => e.propertyName === 'width' && e.target === content),
          take(1),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe(() => window.dispatchEvent(new Event('resize')));
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  getUsageMap() {
    return combineLatest([this.account$, this.selectedPeriod, this.kbs]).pipe(
      switchMap(([account, period, kbs]) => {
        const requests = kbs
          .map((kb) =>
            this.sdk.nuclia.db
              .getUsage(account.id, period.start.toISOString(), period.end.toISOString(), kb.id)
              .pipe(map((usage) => ({ key: kb.id, usage }))),
          )
          .concat([
            this.sdk.nuclia.db
              .getUsage(account.id, period.start.toISOString(), period.end.toISOString())
              .pipe(map((usage) => ({ key: 'account', usage }))),
          ]);
        return forkJoin(requests);
      }),
      map((usage) =>
        usage.reduce(
          (acc, curr) => {
            acc[curr.key] = curr.usage;
            return acc;
          },
          {} as { [key: string]: UsagePoint[] },
        ),
      ),
      shareReplay(1),
    );
  }

  goToSection(section: AccountSettingsTab) {
    this.selectedTab = section;
    this.cdr.markForCheck();
    // pa-tabs._xPosition can go stale when the new tab's content causes a
    // micro layout shift (e.g. app-account-users loading its data).  Dispatching
    // resize after Angular has rendered the new content forces pa-tabs to
    // recapture _xPosition and reposition the slider correctly.
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
  }
}
