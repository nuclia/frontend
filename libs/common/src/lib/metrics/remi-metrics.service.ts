import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { DatedRangeChartData, GroupedBarChartData, RangeChartData } from '../charts';
import { TranslateService } from '@ngx-translate/core';
import { endOfDay, format, startOfDay, subDays, subHours } from 'date-fns';
import {
  RemiQueryCriteria,
  RemiQueryResponse,
  RemiQueryResponseContextDetails,
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

const PAGE_SIZE = 10;

@Injectable({
  providedIn: 'root',
})
export class RemiMetricsService {
  private translate = inject(TranslateService);
  private sdk = inject(SDKService);

  private _healthStatusOnError = new BehaviorSubject(false);
  private _evolutionDataOnError = new BehaviorSubject(false);
  private _lowContextOnError = new BehaviorSubject(false);
  private _noAnswerOnError = new BehaviorSubject(false);
  private _badFeedbackOnError = new BehaviorSubject(false);
  private _period = new BehaviorSubject<RemiPeriods>('7d');

  period = this._period.asObservable();
  healthStatusOnError = this._healthStatusOnError.asObservable();
  evolutionDataOnError = this._evolutionDataOnError.asObservable();
  lowContextOnError = this._lowContextOnError.asObservable();
  noAnswerOnError = this._noAnswerOnError.asObservable();
  badFeedbackOnError = this._badFeedbackOnError.asObservable();

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
        from = startOfDay(subDays(today.toISOString(), days).toISOString()).toISOString();
        to = endOfDay(today.toISOString()).toISOString();
      }

      return {
        aggregation,
        from,
        to,
      };
    }),
  );
  private _lowContextCriteria = new BehaviorSubject<RemiQueryCriteria | null>(null);
  private _noAnswerCriteria = new BehaviorSubject<RemiQueryCriteria | null>(null);
  private _badFeedbackCriteria = new BehaviorSubject<RemiQueryCriteria | null>(null);

  lowContextCriteria = this._lowContextCriteria.asObservable();
  noAnswerCriteria = this._noAnswerCriteria.asObservable();
  badFeedbackCriteria = this._badFeedbackCriteria.asObservable();

  lowContextPage = this._lowContextCriteria.pipe(
    map((criteria) => (criteria?.pagination?.starting_after || 0) / PAGE_SIZE),
  );
  noAnswerPage = this._noAnswerCriteria.pipe(
    map((criteria) => (criteria?.pagination?.starting_after || 0) / PAGE_SIZE),
  );
  badFeedbackPage = this._badFeedbackCriteria.pipe(
    map((criteria) => (criteria?.pagination?.starting_after || 0) / PAGE_SIZE),
  );

  updatePeriod(value: RemiPeriods) {
    this._period.next(value);
  }

  updateLowContextCriteria(value: RemiQueryCriteria, page: number) {
    this._lowContextCriteria.next({
      ...value,
      pagination: {
        limit: PAGE_SIZE,
        starting_after: PAGE_SIZE * page,
      },
    });
  }
  updateNoAnswerCriteria(month: string, page: number) {
    this._noAnswerCriteria.next({
      status: 'NO_CONTEXT',
      month,
      pagination: {
        limit: PAGE_SIZE,
        starting_after: PAGE_SIZE * page,
      },
    });
  }

  updateBadFeedbackCriteria(month: string, page: number) {
    this._badFeedbackCriteria.next({
      feedback_good: false,
      month,
      pagination: {
        limit: PAGE_SIZE,
        starting_after: PAGE_SIZE * page,
      },
    });
  }

  healthCheckData: Observable<RangeChartData[]> = combineLatest([this.sdk.currentKb, this.scoreParameters]).pipe(
    switchMap(([kb, parameters]) =>
      kb.activityMonitor.getRemiScores(parameters.from).pipe(
        catchError((err) => {
          console.error(err);
          this._healthStatusOnError.next(true);
          return of([]);
        }),
      ),
    ),
    map((data) => {
      if (data.length !== 1) {
        console.error(`Health check data: One point expected but got ${data.length}`, data);
        this._healthStatusOnError.next(true);
        return [];
      }
      this._healthStatusOnError.next(false);
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
        map((data) => {
          this._evolutionDataOnError.next(false);
          return {
            parameters,
            results: data.map((item) => (item.metrics.length > 0 ? item : null)).filter((item) => !!item),
          };
        }),
        catchError(() => {
          this._evolutionDataOnError.next(true);
          return of({ results: [], parameters });
        }),
      ),
    ),
    shareReplay(1),
  );
  noEvolutionData: Observable<boolean> = this.rawEvolutionData.pipe(map((data) => data.results.length === 0));

  groundednessEvolution: Observable<DatedRangeChartData[]> = this.rawEvolutionData.pipe(
    map((data) => this.getEvolutionForMetric(data, 'groundedness')),
  );
  answerEvolution: Observable<DatedRangeChartData[]> = this.rawEvolutionData.pipe(
    map((data) => this.getEvolutionForMetric(data, 'answer_relevance')),
  );
  contextEvolution: Observable<DatedRangeChartData[]> = this.rawEvolutionData.pipe(
    map((data) => this.getEvolutionForMetric(data, 'context_relevance')),
  );

  missingKnowledgeNoAnswer = combineLatest([
    this.sdk.currentKb,
    this.noAnswerCriteria.pipe(filter((criteria) => !!criteria)),
  ]).pipe(
    switchMap(([kb, criteria]) =>
      kb.activityMonitor.queryRemiScores(criteria).pipe(
        tap(() => this._noAnswerOnError.next(false)),
        catchError((err) => {
          console.error(err);
          this._noAnswerOnError.next(true);
          return of({ data: [], has_more: false });
        }),
      ),
    ),
    shareReplay(1),
  );

  missingKnowledgeLowContext: Observable<RemiQueryResponse> = combineLatest([
    this.sdk.currentKb,
    this.lowContextCriteria.pipe(filter((criteria) => !!criteria)),
  ]).pipe(
    switchMap(([kb, criteria]) =>
      kb.activityMonitor.queryRemiScores(criteria).pipe(
        tap(() => this._lowContextOnError.next(false)),
        catchError((err) => {
          console.error(err);
          this._lowContextOnError.next(true);
          return of({ data: [], has_more: false });
        }),
      ),
    ),
    shareReplay(1),
  );
  missingKnowledgeBarPlotData: Observable<{ [id: number]: GroupedBarChartData[] }> =
    this.missingKnowledgeLowContext.pipe(
      map((response) =>
        response.data.reduce(
          (plotData, item) => {
            const contextDistribution: { [score: string]: number } = this.getDistribution(
              item.remi?.context_relevance || [],
            );
            const groundednessDistribution: { [score: string]: number } = this.getDistribution(
              item.remi?.groundedness || [],
            );
            const groups: string[] = Object.keys(contextDistribution)
              .concat(Object.keys(groundednessDistribution))
              .reduce((deduplicatedGroups, key) => {
                if (!deduplicatedGroups.includes(key)) {
                  deduplicatedGroups.push(key);
                }
                return deduplicatedGroups;
              }, [] as string[]);
            plotData[item.id] = groups
              .sort((a, b) => {
                const aValue = parseInt(a.slice(0, -1), 10);
                const bValue = parseInt(b.slice(0, -1), 10);
                return aValue > bValue ? 1 : -1;
              })
              .map((group) => ({
                group,
                values: {
                  [this.translate.instant('metrics.remi.category-short.context_relevance')]:
                    contextDistribution[group] || 0,
                  [this.translate.instant('metrics.remi.category-short.groundedness')]:
                    groundednessDistribution[group] || 0,
                },
              }));
            return plotData;
          },
          {} as { [id: number]: GroupedBarChartData[] },
        ),
      ),
    );

  missingKnowledgeBadFeedback: Observable<RemiQueryResponse> = combineLatest([
    this.sdk.currentKb,
    this.badFeedbackCriteria.pipe(filter((criteria) => !!criteria)),
  ]).pipe(
    switchMap(([kb, criteria]) =>
      kb.activityMonitor.queryRemiScores(criteria).pipe(
        tap(() => this._badFeedbackOnError.next(false)),
        catchError(() => {
          this._badFeedbackOnError.next(true);
          return of({ data: [], has_more: false });
        }),
      ),
    ),
    shareReplay(1),
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

  private getDistribution(scores: number[]): { [score: string]: number } {
    return scores.reduce(
      (distribution, score) => {
        const key = `${score * 20}%`;
        if (distribution[key]) {
          distribution[key]++;
        } else {
          distribution[key] = 1;
        }
        return distribution;
      },
      {} as { [score: string]: number },
    );
  }
}
