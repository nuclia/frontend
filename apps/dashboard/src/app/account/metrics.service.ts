import { inject, Injectable } from '@angular/core';
import { AccountService, BillingService, FeaturesService, Prices, SDKService } from '@flaps/core';
import { catchError, combineLatest, forkJoin, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';
import { format, getDaysInMonth, isFuture, subDays, subMonths } from 'date-fns';
import { AccountTypes, UsageMetric, UsagePoint, UsageType } from '@nuclia/core';

export type ChartData = {
  data: [string, number][];
  domain: string[];
  threshold?: number;
  yUnit?: string;
};

function defaultMapper(value: number) {
  return value;
}

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
  isSubscribedToStripe = this.billingService.isSubscribedToStripe;
  accountUsage = this.billingService.getAccountUsage().pipe(shareReplay(1));
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
      start: new Date(`${usage.start_billing_date}Z`),
      end: new Date(`${usage.end_billing_date}Z`),
    })),
    catchError(() => of(undefined)),
  );
  last30Days = { start: subDays(new Date(), 30), end: new Date() };
  period = this.isSubscribedToStripe.pipe(
    switchMap((isSubscribed) => {
      if (isSubscribed) {
        return this.subscriptionPeriod;
      } else {
        return of(this.getCurrentMonth());
      }
    }),
    map((period) => period || this.getCurrentMonth()),
  );
  prices: Observable<{ [key in AccountTypes]: Prices }> = this.billingService.getPrices().pipe(shareReplay());

  mappers: Partial<{ [key in UsageType]: (value: number) => number }> = {
    [UsageType.MEDIA_SECONDS_PROCESSED]: (value) => value / 3600,
    [UsageType.SLOW_PROCESSING_TIME]: (value) => value / 3600,
    [UsageType.TRAIN_SECONDS]: (value) => value / 3600,
  };
  units: Partial<{ [key in UsageType]: string }> = {
    [UsageType.NUCLIA_TOKENS]: 'metrics.units.tokens',
    [UsageType.MEDIA_SECONDS_PROCESSED]: 'metrics.units.hours',
    [UsageType.SEARCHES_PERFORMED]: 'metrics.units.queries',
    [UsageType.SLOW_PROCESSING_TIME]: 'metrics.units.hours',
    [UsageType.TRAIN_SECONDS]: 'metrics.units.hours',
  };

  getUsageCount(usage: UsageType, kbId?: string): Observable<{ year: number; month: number; sinceCreation: number }> {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const twelveMonthsAgo = subMonths(now, 12);
    return this.account$.pipe(
      switchMap((account) =>
        forkJoin([
          this.sdk.nuclia.db.getUsage(account.id, twelveMonthsAgo.toISOString(), now.toISOString(), kbId),
          this.sdk.nuclia.db.getUsage(account.id, thirtyDaysAgo.toISOString(), now.toISOString(), kbId),
          this.sdk.nuclia.db.getUsage(account.id, account.creation_date, now.toISOString(), kbId),
        ]),
      ),
      map(([yearPoint, monthPoint, sinceCreationPoint]) => {
        const yearMetric = yearPoint[0].metrics.find((metric) => metric.name === usage) as UsageMetric;
        const monthMetric = monthPoint[0].metrics.find((metric) => metric.name === usage) as UsageMetric;
        const sinceCreationMetric = sinceCreationPoint[0].metrics.find(
          (metric) => metric.name === usage,
        ) as UsageMetric;
        return {
          year: yearMetric.value,
          month: monthMetric.value,
          sinceCreation: sinceCreationMetric.value,
        };
      }),
    );
  }

  getSearchCount() {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const twelveMonthsAgo = subMonths(now, 12);
    return forkJoin([this.account$.pipe(take(1)), this.sdk.currentKb.pipe(take(1))]).pipe(
      switchMap(([account, kb]) =>
        forkJoin([
          kb.activityMonitor.getSearchMetrics(twelveMonthsAgo.toISOString(), now.toISOString()),
          kb.activityMonitor.getSearchMetrics(thirtyDaysAgo.toISOString(), now.toISOString()),
          kb.activityMonitor.getSearchMetrics(account.creation_date, now.toISOString()),
        ]),
      ),
      map(([year, month, sinceCreation]) => {
        return { year: year[0], month: month[0], sinceCreation: sinceCreation[0] };
      }),
    );
  }

  getUsageCharts(kbId?: string, cumulative = false): Observable<Partial<{ [key in UsageType]: ChartData }>> {
    return combineLatest([this.account$, this.period]).pipe(
      switchMap(([account, period]) =>
        this.sdk.nuclia.db.getUsage(account.id, period.start.toISOString(), period.end.toISOString(), kbId, 'day').pipe(
          map((usagePoints) => {
            const charts: Partial<{ [key in UsageType]: ChartData }> = usagePoints.reduce((charts, point) => {
              for (const usageType of Object.values(UsageType)) {
                this.addPointToChart(point, charts, usageType, cumulative);
              }
              return charts;
            }, this.getEmptyCharts());

            return charts;
          }),
        ),
      ),
    );
  }

  getSearchCharts(): Observable<{ search: ChartData; ask: ChartData }> {
    return forkJoin([this.sdk.currentKb.pipe(take(1)), this.period.pipe(take(1))]).pipe(
      switchMap(([kb, period]) =>
        kb.activityMonitor.getSearchMetrics(period.start.toISOString(), period.end.toISOString(), 'day').pipe(
          map((items) => {
            return {
              search: {
                data: items.map((item) => [format(new Date(item.timestamp), 'd/MM'), item.search] as [string, number]),
                domain: items.map((item) => format(new Date(item.timestamp), 'd/MM')),
                yUnit: 'metrics.units.queries',
              },
              ask: {
                data: items.map((item) => [format(new Date(item.timestamp), 'd/MM'), item.chat] as [string, number]),
                domain: items.map((item) => format(new Date(item.timestamp), 'd/MM')),
                yUnit: 'metrics.units.queries',
              },
            };
          }),
        ),
      ),
    );
  }

  getCumulativeUsageCharts(kbId?: string): Observable<Partial<{ [key in UsageType]: ChartData }>> {
    return this.getUsageCharts(kbId, true);
  }

  private getEmptyCharts() {
    const emptyCharts: Partial<{ [key in UsageType]: ChartData }> = {};
    for (const usageType of Object.values(UsageType)) {
      emptyCharts[usageType] = {
        yUnit: this.units[usageType],
        domain: [],
        data: [],
      };
    }
    return emptyCharts;
  }

  private addPointToChart(
    point: UsagePoint,
    charts: Partial<{ [key in UsageType]: ChartData }>,
    type: UsageType,
    cumulative = false,
  ) {
    const date = format(new Date(point.timestamp), 'd/MM');
    const metric = point.metrics.find((metric) => metric.name === type);
    const chart = charts[type];
    if (metric && chart) {
      chart.domain.push(date);
      const mapper: (value: number) => number = this.mappers[type] || defaultMapper;
      let value = mapper(metric.value);
      if (cumulative && chart.data.length > 0) {
        value += chart.data[chart.data.length - 1][1];
      }
      chart.data.push([date, value]);
    }
  }

  getCurrentMonth() {
    return this.getLastMonths(1)[0];
  }

  getLastMonths(num: number) {
    const periods: { start: Date; end: Date }[] = [];
    const currentMonth = new Date().getMonth();
    for (let i = 0; i < num; i++) {
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      start.setUTCMonth(currentMonth - i);
      const end = new Date(start);
      end.setUTCDate(getDaysInMonth(end));
      end.setUTCHours(23, 59, 59, 999);
      periods.push({ start, end });
    }
    return periods;
  }

  getLastStripePeriods(period: { start: Date; end: Date }, num: number) {
    const periods: { start: Date; end: Date }[] = [period];
    const isLastDayOfMonth =
      period.start.getUTCDate() === getDaysInMonth(period.start) &&
      period.end.getUTCDate() === getDaysInMonth(period.end);
    for (let i = 0; i < num - 1; i++) {
      const end = new Date(periods[periods.length - 1].start);
      const start = new Date(end);
      if (isLastDayOfMonth) {
        const prevMonth = new Date(start);
        prevMonth.setUTCDate(1);
        prevMonth.setUTCMonth(prevMonth.getUTCMonth() - 1);
        start.setUTCFullYear(prevMonth.getUTCFullYear());
        start.setUTCMonth(prevMonth.getUTCMonth(), getDaysInMonth(prevMonth));
      } else {
        start.setUTCMonth(start.getUTCMonth() - 1);
      }
      periods.push({ start, end });
    }
    return periods;
  }
}
