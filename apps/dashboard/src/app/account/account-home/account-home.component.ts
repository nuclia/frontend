import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AccountService, SDKService } from '@flaps/core';
import { StatsPeriod, StatsRange, StatsType } from '@nuclia/core';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';
import { addDays, format, isWithinInterval, lastDayOfMonth, setDate, subDays } from 'date-fns';
import { TranslateService } from '@ngx-translate/core';
import { SisToastService } from '@nuclia/sistema';
import { NavigationService, TickOptions } from '@flaps/common';
import { BillingService } from '../billing/billing.service';

type ChartData = {
  data: [string, number][];
  domain: string[];
  threshold?: number;
};

@Component({
  selector: 'app-account-home',
  templateUrl: './account-home.component.html',
  styleUrls: ['./account-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountHomeComponent {
  account = this.sdk.currentAccount;
  kbs = this.sdk.kbList;
  statsTypes = [StatsType.MEDIA_SECONDS, StatsType.SEARCHES, StatsType.TRAIN_SECONDS];
  isTrial = this.account.pipe(map((account) => account.type === 'stash-trial'));
  isSubscribed = this.billingService.isSubscribed;
  usage = this.billingService.getAccountUsage().pipe(shareReplay());
  trialPeriod = combineLatest([this.account, this.accountService.getAccountTypes()]).pipe(
    map(([account, defaults]) => {
      const expiration = account.trial_expiration_date ? new Date(`${account.trial_expiration_date}+00:00`) : undefined;
      return expiration
        ? { start: subDays(expiration, defaults['stash-trial'].max_trial_days), end: expiration }
        : undefined;
    }),
  );
  subscriptionPeriod = this.usage.pipe(
    map((usage) => ({
      start: new Date(`${usage.start_billing_date}+00:00`),
      end: new Date(`${usage.end_billing_date}+00:00`),
    })),
    catchError(() => of(undefined)),
  );
  currentMonth = { start: setDate(new Date(), 1), end: lastDayOfMonth(new Date()) };
  period = combineLatest([this.isTrial, this.isSubscribed]).pipe(
    switchMap(([isTrial, isSubscribed]) => {
      if (isTrial) {
        return this.trialPeriod;
      } else if (isSubscribed) {
        return this.subscriptionPeriod;
      } else {
        return of(this.currentMonth);
      }
    }),
    map((period) => period || this.currentMonth),
    shareReplay(),
  );
  prices = this.billingService.getPrices().pipe(shareReplay());
  mappers: { [key: string]: (value: number) => number } = {
    [StatsType.MEDIA_SECONDS]: (value) => value / 3600,
    [StatsType.TRAIN_SECONDS]: (value) => value / 3600,
  };

  allCharts = true;
  charts: { [type in StatsType]: Observable<ChartData> } = this.statsTypes.reduce(
    (acc, current) => ({ ...acc, [current]: this.getChartData(current).pipe(take(1), shareReplay()) }),
    {} as { [type in StatsType]: Observable<ChartData> },
  );

  statsRange = StatsRange;
  showPending = false;
  pendingRange: BehaviorSubject<StatsRange> = new BehaviorSubject<StatsRange>(StatsRange.anHour);
  pendingTickOptions: Observable<TickOptions> = this.pendingRange.pipe(
    map((range) => {
      switch (range) {
        case StatsRange.sixHours:
        case StatsRange.twelveHours:
        case StatsRange.twentyFourHours:
          return { modulo: 6 };
        case StatsRange.fortyHeightHours:
          return { modulo: 10, displayTick: true };
        default:
          return { modulo: 10 };
      }
    }),
  );
  pending = combineLatest([this.account, this.pendingRange]).pipe(
    switchMap(([account, pendingRange]) =>
      this.sdk.nuclia.db.getProcessingStats(pendingRange, account!.id).pipe(
        map((stats) => {
          let xFormat: string;
          switch (pendingRange) {
            case StatsRange.fortyHeightHours:
              xFormat = 'd/MM H:mm';
              break;
            default:
              xFormat = 'H:mm';
              break;
          }
          return stats.map(
            (stat, index) =>
              [format(new Date(stat.time_period), index === 0 ? 'H:mm' : xFormat), stat.stats] as [string, number],
          );
        }),
        catchError(() => {
          this.toastService.error(this.translate.instant(`account.chart_error_processing_status`));
          return of([]);
        }),
      ),
    ),
  );

  totalQueries = this.account.pipe(
    switchMap((account) => this.sdk.nuclia.db.getStats(account.slug, StatsType.SEARCHES, undefined, StatsPeriod.YEAR)),
    map((stats) => stats.reduce((acc, stat) => acc + stat.stats, 0)),
  );

  constructor(
    private sdk: SDKService,
    private toastService: SisToastService,
    private translate: TranslateService,
    private billingService: BillingService,
    private accountService: AccountService,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
  ) {}

  getChartData(statsType: StatsType): Observable<ChartData> {
    return combineLatest([
      this.getStats(statsType),
      this.isSubscribed.pipe(
        switchMap((isSubscribed) => (isSubscribed ? this.getThreshold(statsType) : this.getLimit(statsType))),
      ),
      this.period,
    ]).pipe(
      map(([stats, threshold, period]) => ({
        data: stats
          .map((stat) => [new Date(stat.time_period), stat.stats] as [Date, number])
          .reverse()
          // Keep only points in current period
          .reduce(
            (currentMonthStats, point) => {
              const currentPeriod = { start: new Date(period.start).setUTCHours(0, 0, 0, 0), end: new Date() };
              if (isWithinInterval(point[0], currentPeriod)) {
                currentMonthStats.push([
                  point[0],
                  (currentMonthStats[currentMonthStats.length - 1]?.[1] || 0) + point[1],
                ]);
              }
              return currentMonthStats;
            },
            [] as [Date, number][],
          )
          .map((stat) => [format(stat[0], 'd'), this.mappers[statsType] ? this.mappers[statsType](stat[1]) : stat[1]]),
        domain: stats.map((stat) => format(new Date(stat.time_period), 'd')).reverse(),
        threshold,
      })),
    );
  }

  getStats(statsType: StatsType) {
    return combineLatest([this.account, this.period]).pipe(
      switchMap(([account, period]) => {
        // getStats only returns data for 30 days
        const lastDate = addDays(period.start, 29).getTime().toString();
        return this.sdk.nuclia.db.getStats(account.slug, statsType, undefined, StatsPeriod.MONTH, lastDate).pipe(
          catchError(() => {
            this.toastService.error(this.translate.instant(`account.chart_error_${statsType}`));
            return of([]);
          }),
        );
      }),
    );
  }

  getLimit(statsType: StatsType): Observable<number | undefined> {
    return this.account.pipe(
      map((account) => {
        const limits = account.limits.usage;
        let limit;
        let processedLimit;
        switch (statsType) {
          case StatsType.MEDIA_SECONDS:
            limit = limits.monthly_limit_media_seconds_processed;
            processedLimit = limits.monthly_limit_media_seconds_processed / 3600;
            break;
          case StatsType.SEARCHES:
            limit = limits.monthly_limit_hosted_searches_performed;
            break;
        }
        return limit === -1 ? undefined : processedLimit || limit;
      }),
    );
  }

  getThreshold(statsType: StatsType): Observable<number | undefined> {
    return combineLatest([this.account, this.prices]).pipe(
      map(([account, prices]) => {
        const usage = prices[account.type].usage;
        switch (statsType) {
          case StatsType.MEDIA_SECONDS:
            return usage.media.threshold;
          case StatsType.SEARCHES:
            return usage.searches.threshold;
          case StatsType.TRAIN_SECONDS:
            return usage.training.threshold;
          default:
            return undefined;
        }
      }),
    );
  }

  toggleCharts() {
    this.allCharts = !this.allCharts;
    this.cdr.markForCheck();
  }

  getKbUrl(account: string, kb: string) {
    return this.navigation.getKbUrl(account, kb);
  }
}
