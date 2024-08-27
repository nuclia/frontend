import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';
import { DatedRangeChartData, RangeChartData } from '../charts';
import { TranslateService } from '@ngx-translate/core';
import { endOfDay, format, startOfDay, subDays, subHours } from 'date-fns';
import {
  RemiQueryCriteria,
  RemiQueryResponseContextDetails,
  RemiQueryResponseItem,
  RemiScoresResponseItem,
  UsageAggregation,
} from '@nuclia/core';
import { SDKService } from '@flaps/core';
import { catchError } from 'rxjs/operators';

export type RemiPeriods = '24h' | '7d' | '14d' | '30d';

interface RangeParameters {
  aggregation: UsageAggregation;
  from: string;
  to?: string;
}

interface RawEvolutionResults {
  results: RemiScoresResponseItem[];
  parameters: RangeParameters;
}

@Injectable({
  providedIn: 'root',
})
export class RemiMetricsService {
  private translate = inject(TranslateService);
  private sdk = inject(SDKService);

  private _period = new BehaviorSubject<RemiPeriods>('7d');
  period = this._period.asObservable();

  private scoreParameters: Observable<RangeParameters> = this.period.pipe(
    map((period) => {
      let aggregation: UsageAggregation = 'day';
      let from, to;
      const today = new Date();
      if (period === '24h') {
        aggregation = 'hour';
        from = subHours(today.toISOString(), 24).toISOString();
        to = today.toISOString();
      } else {
        const days = parseInt(period.substring(0, period.indexOf('d')), 10);
        from = startOfDay(subDays(today.toISOString(), days)).toISOString();
        to = endOfDay(today).toISOString();
      }

      return {
        aggregation,
        from,
        to,
      };
    }),
  );
  private _queryCriteria = new BehaviorSubject<RemiQueryCriteria | null>(null);
  queryCriteria = this._queryCriteria.asObservable();

  updatePeriod(value: RemiPeriods) {
    this._period.next(value);
  }

  updateCriteria(value: RemiQueryCriteria) {
    this._queryCriteria.next(value);
  }

  healthCheckData: Observable<RangeChartData[]> = combineLatest([this.sdk.currentKb, this.scoreParameters]).pipe(
    switchMap(([kb, parameters]) =>
      kb.activityMonitor.getRemiScores(parameters.from).pipe(
        catchError((err) => {
          console.error(err);
          return of([]);
        }),
      ),
    ),
    map((data) => {
      if (data.length !== 1) {
        console.error(`Health check data: One point expected but got ${data.length}`, data);
        return [];
      }
      return data[0].metrics.map((item) => ({
        category: this.translate.instant(`metrics.remi.category-short.${item.name}`),
        average: (item.average * 100) / 5,
        min: (item.min * 100) / 5,
        max: (item.max * 100) / 5,
      }));
    }),
  );

  private rawEvolutionData: Observable<RawEvolutionResults> = combineLatest([
    this.sdk.currentKb,
    this.scoreParameters,
  ]).pipe(
    switchMap(([kb, parameters]) =>
      kb.activityMonitor.getRemiScores(parameters.from, parameters.to, parameters.aggregation).pipe(
        map((data) => ({
          parameters,
          results: data.map((item) => (item.metrics.length > 0 ? item : null)).filter((item) => !!item),
        })),
        catchError((err) => {
          console.error(err);
          return of({ results: [], parameters });
        }),
      ),
    ),
    shareReplay(1),
  );

  groundednessEvolution: Observable<DatedRangeChartData[]> = this.rawEvolutionData.pipe(
    map((data) => this.getEvolutionForMetric(data, 'groundedness')),
  );
  answerEvolution: Observable<DatedRangeChartData[]> = this.rawEvolutionData.pipe(
    map((data) => this.getEvolutionForMetric(data, 'answer_relevance')),
  );
  contextEvolution: Observable<DatedRangeChartData[]> = this.rawEvolutionData.pipe(
    map((data) => this.getEvolutionForMetric(data, 'context_relevance')),
  );

  missingKnowledgeData: Observable<RemiQueryResponseItem[]> = combineLatest([
    this.sdk.currentKb,
    this.queryCriteria.pipe(filter((criteria) => !!criteria)),
  ]).pipe(
    switchMap(([kb, criteria]) =>
      kb.activityMonitor.queryRemiScores(criteria).pipe(
        catchError((err) => {
          console.error(err);
          return of([]);
        }),
      ),
    ),
  );

  getMissingKnowledgeDetails(id: number): Observable<RemiQueryResponseContextDetails> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.activityMonitor.getFullContexts(id)),
    );
  }

  private getEvolutionForMetric(
    data: RawEvolutionResults,
    category: 'groundedness' | 'answer_relevance' | 'context_relevance',
  ): DatedRangeChartData[] {
    return data.results.map((item) => {
      const groundedness = item.metrics.find((metric) => metric.name === category);
      return {
        timestamp: format(new Date(item.timestamp), data.parameters.aggregation === 'hour' ? 'HH' : 'd/MM'),
        min: (groundedness!.min * 100) / 5,
        max: (groundedness!.max * 100) / 5,
        average: (groundedness!.average * 100) / 5,
      };
    });
  }
}
