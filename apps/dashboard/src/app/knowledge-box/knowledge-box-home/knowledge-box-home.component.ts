import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AppService, ChartData, MetricsService, RangeChartData, RemiMetricsService } from '@flaps/common';
import {
  FeaturesService,
  GETTING_STARTED_DONE_KEY,
  NavigationService,
  SDKService,
  UploadEventService,
  ZoneService,
} from '@flaps/core';
import { ModalConfig, OptionModel } from '@guillotinaweb/pastanaga-angular';
import { BlockedFeature, Counters, setZoneInRegionalUrl, UsageType } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  repeat,
  shareReplay,
  Subject,
  switchMap,
  take,
  timer,
} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KbOnboardingStateService } from './kb-onboarding/kb-onboarding-state.service';
import { UsageModalComponent } from './kb-usage/usage-modal.component';
import { TestPageModalComponent } from './test-page-modal/test-page-modal.component';

const POLLING_DELAY = 30000; // 30 seconds

@Component({
  selector: 'app-knowledge-box-home',
  templateUrl: './knowledge-box-home.component.html',
  styleUrls: ['./knowledge-box-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KnowledgeBoxHomeComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  locale: Observable<string> = this.app.currentLocale;
  account = this.sdk.currentAccount;
  currentKb = this.sdk.currentKb;

  isKbAdmin = this.features.isKbAdmin;
  isKbContrib = this.features.isKBContrib;
  isAccountManager = this.features.isAccountManager;
  isRemiMetricsEnabled = this.features.authorized.remiMetrics;

  configuration = this.currentKb.pipe(switchMap((kb) => kb.getConfiguration()));
  endpoint = this.currentKb.pipe(map((kb) => kb.fullpath));
  uid = this.currentKb.pipe(map((kb) => kb.id));
  mcp = this.currentKb.pipe(
    map((kb) => setZoneInRegionalUrl(this.sdk.nuclia.options.backend, kb.zone, 'dp') + `/v1${kb.path}/mcp`),
  );
  zone = combineLatest([this.currentKb, this.zoneService.getZones()]).pipe(
    map(([kb, zones]) => {
      const zone = zones.find((zone) => zone.slug === kb.zone);
      return zone?.title || kb.zone;
    }),
  );
  stateLabel: Observable<string> = this.currentKb.pipe(
    map((kb) => kb.state),
    map((state) => (state ? `dashboard-home.state.${state.toLowerCase()}` : '')),
  );
  counters: Observable<Counters | undefined> = this.sdk.counters;

  allChartsData: Observable<Partial<{ [key in UsageType]: ChartData }>> = this.isAccountManager.pipe(
    filter((isManager) => isManager),
    switchMap(() => combineLatest([this.currentKb, this.currentPeriod.pipe(filter((period) => !!period))])),
    switchMap(([kb, period]) => this.metrics.getUsageCharts(kb.id, period)),
    takeUntil(this.unsubscribeAll),
    shareReplay(1),
  );
  processingChart = this.allChartsData.pipe(map((charts) => charts[UsageType.SLOW_PROCESSING_TIME]));
  nucliaTokenChart = this.allChartsData.pipe(map((charts) => charts[UsageType.NUCLIA_TOKENS]));

  searchChartsData = this.isAccountManager.pipe(
    filter((isManager) => isManager),
    switchMap(() => combineLatest([this.currentKb, this.currentPeriod.pipe(filter((period) => !!period))])),
    switchMap(([, period]) => this.metrics.getSearchCharts(period)),
    takeUntil(this.unsubscribeAll),
    shareReplay(1),
  );
  searchChart = this.searchChartsData.pipe(map((charts) => charts.search));
  askChart = this.searchChartsData.pipe(map((charts) => charts.ask));

  nucliaTokensCounts = this.isAccountManager.pipe(
    filter((isManager) => isManager),
    switchMap(() => this.currentKb),
    switchMap((kb) => this.metrics.getUsageCount(UsageType.NUCLIA_TOKENS, kb.id)),
    takeUntil(this.unsubscribeAll),
    shareReplay(1),
  );
  searchQueriesCounts = this.isAccountManager.pipe(
    filter((isManager) => isManager),
    switchMap(() => this.currentKb),
    switchMap(() => this.metrics.getSearchCount()),
    takeUntil(this.unsubscribeAll),
    shareReplay(1),
  );
  isSubscribed = this.metrics.isSubscribedToStripe;

  kbUrl = combineLatest([this.account, this.currentKb]).pipe(
    map(([account, kb]) => {
      const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
      return this.navigationService.getKbUrl(account.slug, kbSlug);
    }),
  );
  showAccountStatus = combineLatest([this.features.isAccountManager, this.features.isTrial]).pipe(
    map(([isManager, isTrial]) => isManager && isTrial),
  );
  isChartDropdownOpen = false;

  readonly chartHeight = 232;
  readonly defaultChartOption = new OptionModel({
    id: 'ask',
    label: 'metrics.ask.title',
    value: 'ask',
  });
  currentChart: OptionModel = this.defaultChartOption;
  currentPeriod = new BehaviorSubject<{ start: Date; end: Date } | null>(null);
  chartDropdownOptions: OptionModel[] = [
    this.defaultChartOption,
    new OptionModel({ id: 'search', label: 'metrics.search.title', value: 'search' }),
    new OptionModel({ id: 'processing', label: 'metrics.processing.title', value: 'processing' }),
    new OptionModel({ id: 'token', label: 'metrics.nuclia-tokens.title', value: 'token' }),
  ];
  chartPeriods = combineLatest([this.isSubscribed, this.metrics.period]).pipe(
    map(([isSubscribed, period]) =>
      isSubscribed ? this.metrics.getLastStripePeriods(period, 6) : this.metrics.getLastMonths(6),
    ),
  );

  clipboardSupported = !!(navigator.clipboard && navigator.clipboard.writeText);
  developerExpanded = false;
  copyIcon = {
    endpoint: 'copy',
    uid: 'copy',
    mcp: 'copy',
  };

  healthCheckData: Observable<RangeChartData[]> = this.remiMetrics.healthCheckData;

  uploadBlocked = this.account.pipe(
    map(
      (account) =>
        account.blocked_features.includes(BlockedFeature.UPLOAD) ||
        account.blocked_features.includes(BlockedFeature.PROCESSING),
    ),
  );
  generativeBlocked = this.account.pipe(map((account) => account.blocked_features.includes(BlockedFeature.GENERATIVE)));

  constructor(
    private app: AppService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
    private navigationService: NavigationService,
    private metrics: MetricsService,
    private modal: SisModalService,
    private zoneService: ZoneService,
    private remiMetrics: RemiMetricsService,
  ) {}

  private onboardingService = inject(KbOnboardingStateService);
  private uploadEventService = inject(UploadEventService);
  onboardingState$ = this.onboardingService.onboardingState$;

  ngOnInit() {
    // We want the health status on the last 7 days
    this.remiMetrics.updatePeriod('7d');
    this.metrics.period.pipe(take(1)).subscribe((period) => {
      this.currentPeriod.next(period);
    });

    // Initial state detection — KB admin only
    this.features.isKbAdmin.pipe(take(1), filter(Boolean)).subscribe(() => {
      this.detectAndAdvanceStep();
    });

    // Processing-step polling: start once when entering processing-data, stop when leaving it.
    // We must NOT re-trigger on every updateState() emission (which happens each poll tick while
    // still processing), because switchMap would cancel+restart the inner repeat and the 30s timer
    // would never elapse. Using filter+take(1) avoids that reset.
    this.onboardingState$
      .pipe(
        filter((state) => !!state && state.currentStep === 'processing-data'),
        take(1),
        switchMap(() =>
          this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => kb.processingStatus()),
            repeat({ delay: () => timer(POLLING_DELAY) }),
            takeUntil(this.onboardingState$.pipe(filter((state) => !state || state.currentStep !== 'processing-data'))),
          ),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => this.detectAndAdvanceStep());

    // Searching-step live metrics check for account managers
    this.onboardingState$
      .pipe(
        filter((state) => !!state && state.currentStep === 'searching-data'),
        take(1),
        switchMap(() => this.features.isAccountManager.pipe(take(1))),
        filter((isManager) => isManager),
        switchMap(() =>
          this.searchQueriesCounts.pipe(
            filter((counts) => counts.month.search > 0 || counts.month.chat > 0),
            take(1),
          ),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => this.onboardingService.markDone());

    this.uploadEventService.processingStarted$
      .pipe(
        filter((triggered) => triggered),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.onboardingService.updateState({ currentStep: 'processing-data' });
        this.sdk.refreshCounter(true); // Keep the counter badge in sync after first upload
        this.uploadEventService.clearProcessingStarted();
      });

    this.uploadEventService.searchPerformed$
      .pipe(
        filter((searched) => searched),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.onboardingState$.pipe(take(1)).subscribe((state) => {
          if (state?.currentStep === 'searching-data') {
            this.onboardingService.markDone();
          }
          this.uploadEventService.clearSearchPerformed();
        });
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private detectAndAdvanceStep(): void {
    if (localStorage.getItem(GETTING_STARTED_DONE_KEY) === 'true') {
      return;
    }

    combineLatest([this.features.isAccountManager.pipe(take(1)), this.currentKb.pipe(take(1))])
      .pipe(
        switchMap(([isManager, kb]) => {
          const searchCount$ = isManager ? this.metrics.getSearchCount().pipe(catchError(() => of(null))) : of(null);
          // Use fresh kb.counters() instead of sdk.counters (cached ReplaySubject that may be
          // stale after a first-ever upload, causing hasResources to remain false).
          return forkJoin([kb.counters(), kb.processingStatus(), searchCount$, this.onboardingState$.pipe(take(1))]);
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(([counters, processingStatus, searchCount, state]) => {
        if (state === null) {
          return; // Already done
        }

        const hasResources = (counters?.resources ?? 0) > 0;
        const isProcessing = (processingStatus.results?.length ?? 0) > 0;
        const hasSearched = searchCount ? searchCount.month.search > 0 || searchCount.month.chat > 0 : false;

        // Special skipped completion
        if (
          state.skipped &&
          ((state.currentStep === 'processing-data' && !isProcessing && hasResources) ||
            state.currentStep === 'searching-data')
        ) {
          this.onboardingService.markDone();
          return;
        }

        if (hasResources && hasSearched) {
          this.onboardingService.markDone();
        } else if (hasResources && isProcessing) {
          this.onboardingService.updateState({ currentStep: 'processing-data' });
        } else if (hasResources && !isProcessing) {
          this.onboardingService.updateState({ currentStep: 'searching-data' });
        }
        // else: stay at uploading-data — no action needed
      });
  }

  copyEndpoint() {
    this.endpoint.pipe(take(1)).subscribe((endpoint) => this.copyToClipboard('endpoint', endpoint));
  }

  copyUid() {
    this.uid.pipe(take(1)).subscribe((uid) => this.copyToClipboard('uid', uid));
  }

  copyMcp() {
    this.mcp.pipe(take(1)).subscribe((mcp) => this.copyToClipboard('mcp', mcp));
  }

  private copyToClipboard(type: 'endpoint' | 'uid' | 'mcp', text: string) {
    navigator.clipboard.writeText(text);
    this.copyIcon = {
      ...this.copyIcon,
      [type]: 'check',
    };
    this.cdr.markForCheck();
    setTimeout(() => {
      this.copyIcon = {
        ...this.copyIcon,
        [type]: 'copy',
      };
      this.cdr.markForCheck();
    }, 1000);
  }

  selectChart(option: OptionModel) {
    this.currentChart = option;
    // when selecting another chart, first the chart is removed from the DOM causing the page height to be reduced
    // then the new chart is added to the DOM increasing again the page height, but the scroll position is lost in the process
    // so we scroll back to the bottom of the page
    setTimeout(() => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollTo({ top: mainElement.offsetHeight, behavior: 'smooth' });
      }
    }, 100);
  }

  selectPeriod(period: { start: Date; end: Date }) {
    this.currentPeriod.next(period);
  }

  openFullscreen() {
    this.modal.openModal(
      UsageModalComponent,
      new ModalConfig({
        data: {
          processingChart: this.processingChart,
          searchChart: this.searchChart,
          askChart: this.askChart,
          tokenChart: this.nucliaTokenChart,
          currentChart: this.currentChart,
          chartDropdownOptions: this.chartDropdownOptions,
          isSubscribed: this.isSubscribed,
          currentPeriod: this.currentPeriod.getValue(),
        },
      }),
    );
  }

  openTestPageModal() {
    this.modal.openModal(TestPageModalComponent);
  }
}
