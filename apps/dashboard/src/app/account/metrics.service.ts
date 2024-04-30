import { inject, Injectable } from '@angular/core';
import { AccountService, BillingService, FeaturesService, SDKService } from '@flaps/core';
import { catchError, combineLatest, forkJoin, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { addDays, format, isFuture, isWithinInterval, lastDayOfMonth, setDate, subDays } from 'date-fns';
import { StatsPeriod, StatsType } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';

export type ChartData = {
  data: [string, number][];
  domain: string[];
  threshold?: number;
  yUnit?: string;
};

@Injectable({
  providedIn: 'root',
})
export class MetricsService {
  private sdk = inject(SDKService);
  private accountService = inject(AccountService);
  private billingService = inject(BillingService);
  private featureService = inject(FeaturesService);

  account$ = this.sdk.currentAccount;
  canUpgrade = this.featureService.canUpgrade;

  isTrial = this.featureService.isTrial;
  isSubscribed = this.billingService.isSubscribedToStripe;
  accountUsage = this.billingService.getAccountUsage().pipe(shareReplay());
  trialPeriod = combineLatest([this.account$, this.accountService.getAccountTypes()]).pipe(
    map(([account, defaults]) => {
      const expiration = account.trial_expiration_date ? new Date(`${account.trial_expiration_date}+00:00`) : undefined;
      if (expiration) {
        // If start date is in the future, that means the trial has been extended (maybe a lot like we do for Nuclia’s accounts),
        // so better to return undefined, so we use currentMonth as chart period
        const start = subDays(expiration, defaults['stash-trial'].max_trial_days);
        return !isFuture(start) ? { start, end: expiration } : undefined;
      } else {
        return undefined;
      }
    }),
  );
  subscriptionPeriod = this.accountUsage.pipe(
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
  );
  prices = this.billingService.getPrices().pipe(shareReplay());

  totalSearchQueriesThisYear = this.account$.pipe(
    switchMap((account) => this.sdk.nuclia.db.getStats(account.slug, StatsType.SEARCHES, undefined, StatsPeriod.YEAR)),
    map((stats) => stats.reduce((acc, stat) => acc + stat.stats, 0)),
  );

  mappers: { [key: string]: (value: number) => number } = {
    [StatsType.MEDIA_SECONDS]: (value) => value / 3600,
    [StatsType.TRAIN_SECONDS]: (value) => value / 3600,
    [StatsType.PROCESSING_TIME]: (value) => value / 3600,
  };
  units: { [key: string]: string } = {
    [StatsType.MEDIA_SECONDS]: 'metrics.units.hours',
    [StatsType.TRAIN_SECONDS]: 'metrics.units.hours',
    [StatsType.PROCESSING_TIME]: 'metrics.units.hours',
    [StatsType.SEARCHES]: 'metrics.units.queries',
    [StatsType.AI_TOKENS_USED]: 'metrics.units.tokens',
  };

  constructor(
    private toastService: SisToastService,
    private translate: TranslateService,
  ) {}

  getSearchQueriesCountForKb(kbId: string): Observable<{ year: number; month: number }> {
    return this.account$.pipe(
      switchMap((account) =>
        forkJoin([
          this.sdk.nuclia.db.getStats(account.slug, StatsType.SEARCHES, kbId, StatsPeriod.YEAR),
          this.sdk.nuclia.db.getStats(account.slug, StatsType.SEARCHES, kbId, StatsPeriod.MONTH),
        ]),
      ),
      map(([yearStats, monthStats]) => ({
        year: yearStats.reduce((acc, stat) => acc + stat.stats, 0),
        month: monthStats.reduce((acc, stat) => acc + stat.stats, 0),
      })),
    );
  }

  getTokensCountForKb(kbId: string): Observable<{ year: number; month: number }> {
    return this.account$.pipe(
      switchMap((account) =>
        forkJoin([
          this.sdk.nuclia.db.getStats(account.slug, StatsType.AI_TOKENS_USED, kbId, StatsPeriod.YEAR),
          this.sdk.nuclia.db.getStats(account.slug, StatsType.AI_TOKENS_USED, kbId, StatsPeriod.MONTH),
        ]),
      ),
      map(([yearStats, monthStats]) => ({
        year: yearStats.reduce((acc, stat) => acc + stat.stats, 0),
        month: monthStats.reduce((acc, stat) => acc + stat.stats, 0),
      })),
    );
  }

  getChartData(statsType: StatsType, cumulative = true, kbId?: string): Observable<ChartData> {
    return combineLatest([
      this.getStats(statsType, kbId),
      this.isSubscribed.pipe(
        switchMap((isSubscribed) => (isSubscribed ? this.getThreshold(statsType) : this.getLimit(statsType))),
      ),
      this.period,
    ]).pipe(
      map(
        ([stats, threshold, period]) => ({
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
                    cumulative ? (currentMonthStats[currentMonthStats.length - 1]?.[1] || 0) + point[1] : point[1],
                  ]);
                }
                return currentMonthStats;
              },
              [] as [Date, number][],
            )
            .map((stat) => [
              format(stat[0], 'd/MM'),
              this.mappers[statsType] ? this.mappers[statsType](stat[1]) : stat[1],
            ]),
          domain: stats.map((stat) => format(new Date(stat.time_period), 'd/MM')).reverse(),
          threshold,
          yUnit: this.units[statsType],
        }),
        catchError((error) => {
          console.error(`Error while getting chart data for ${statsType}`, error);
          return of({
            data: [],
            domain: [],
          });
        }),
      ),
    );
  }

  getLimit(statsType: StatsType): Observable<number | undefined> {
    return this.account$.pipe(
      map((account) => {
        const limits = account.limits?.usage;
        if (!limits) {
          return undefined;
        }
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

  getStats(statsType: StatsType, kbId?: string) {
    return combineLatest([this.account$, this.period]).pipe(
      switchMap(([account, period]) => {
        // getStats only returns data for 30 days
        const lastDate = addDays(period.start, 29).getTime().toString();
        return this.sdk.nuclia.db.getStats(account.slug, statsType, kbId, StatsPeriod.MONTH, lastDate).pipe(
          catchError(() => {
            this.toastService.error(this.translate.instant(`account.chart_error_${statsType}`));
            return of([]);
          }),
        );
      }),
    );
  }

  getThreshold(statsType: StatsType): Observable<number | undefined> {
    return combineLatest([this.account$, this.prices]).pipe(
      map(([account, prices]) => {
        const usage = prices[account.type].usage;
        switch (statsType) {
          case StatsType.MEDIA_SECONDS:
            return usage?.media?.threshold;
          case StatsType.SEARCHES:
            return usage?.searches?.threshold;
          case StatsType.TRAIN_SECONDS:
            return usage?.training?.threshold;
          default:
            return undefined;
        }
      }),
    );
  }
}
