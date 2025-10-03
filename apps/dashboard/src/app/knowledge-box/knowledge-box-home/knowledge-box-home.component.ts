import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AppService, RangeChartData, RemiMetricsService, searchResources } from '@flaps/common';
import { FeaturesService, NavigationService, SDKService, ZoneService } from '@flaps/core';
import { ModalConfig, OptionModel } from '@guillotinaweb/pastanaga-angular';
import { BlockedFeature, Counters, IResource, RESOURCE_STATUS, SortField, UsageType } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { combineLatest, filter, map, Observable, shareReplay, Subject, switchMap, take } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChartData, MetricsService } from '../../account/metrics.service';
import { UsageModalComponent } from './kb-usage/usage-modal.component';

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
  slug = this.currentKb.pipe(map((kb) => kb.slug));
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
    switchMap(() => this.currentKb),
    switchMap((kb) => this.metrics.getUsageCharts(kb.id)),
    takeUntil(this.unsubscribeAll),
    shareReplay(1),
  );
  processingChart = this.allChartsData.pipe(map((charts) => charts[UsageType.SLOW_PROCESSING_TIME]));
  nucliaTokenChart = this.allChartsData.pipe(map((charts) => charts[UsageType.NUCLIA_TOKENS]));

  searchChartsData = this.isAccountManager.pipe(
    filter((isManager) => isManager),
    switchMap(() => this.currentKb),
    switchMap(() => this.metrics.getSearchCharts()),
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

  selectedResourcesTab: 'processed' | 'pending' = 'processed';
  latestProcessedResources: Observable<IResource[]> = this.currentKb.pipe(
    switchMap((kb) =>
      searchResources(kb, {
        pageSize: 6,
        sort: { field: SortField.created, order: 'desc' },
        query: '',
        filters: [],
        page: 0,
        status: RESOURCE_STATUS.PROCESSED,
      }),
    ),
    map((data) => Object.values(data.results.resources || {})),
  );
  processingQueue: Observable<IResource[]> = this.currentKb.pipe(
    switchMap((kb) =>
      searchResources(kb, {
        pageSize: 6,
        sort: { field: SortField.created, order: 'desc' },
        query: '',
        filters: [],
        page: 0,
        status: RESOURCE_STATUS.PENDING,
      }),
    ),
    map((data) => Object.values(data.results.resources || {})),
  );
  isChartDropdownOpen = false;

  readonly chartHeight = 232;
  readonly defaultChartOption = new OptionModel({
    id: 'search',
    label: 'metrics.search.title',
    value: 'search',
  });
  currentChart: OptionModel = this.defaultChartOption;
  chartDropdownOptions: OptionModel[] = [
    this.defaultChartOption,
    new OptionModel({ id: 'ask', label: 'metrics.ask.title', value: 'ask' }),
    new OptionModel({ id: 'processing', label: 'metrics.processing.title', value: 'processing' }),
    new OptionModel({ id: 'token', label: 'metrics.nuclia-tokens.title', value: 'token' }),
  ];
  clipboardSupported: boolean = !!(navigator.clipboard && navigator.clipboard.writeText);
  copyIcon = {
    endpoint: 'copy',
    uid: 'copy',
    slug: 'copy',
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

  ngOnInit() {
    // We want the health status on the last 7 days
    this.remiMetrics.updatePeriod('7d');
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  copyEndpoint() {
    this.endpoint.pipe(take(1)).subscribe((endpoint) => this.copyToClipboard('endpoint', endpoint));
  }

  copyUid() {
    this.uid.pipe(take(1)).subscribe((uid) => this.copyToClipboard('uid', uid));
  }

  private copyToClipboard(type: 'endpoint' | 'uid' | 'slug', text: string) {
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
        },
      }),
    );
  }

  navigateToTestPage() {
    combineLatest([this.account, this.currentKb])
      .pipe(
        take(1),
        map(([account, kb]) => this.navigationService.getTestPageUrl(account.slug, kb.slug)),
      )
      .subscribe((url) => {
        window.open(url, 'blank', 'noreferrer');
      });
  }
}
