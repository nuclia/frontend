import type { WritableKnowledgeBox } from '../kb';
import type { INuclia } from '../../../models';
import {
  RemiQueryCriteria,
  RemiQueryResponseContextDetails,
  RemiQueryResponseItem,
  RemiScoresResponseItem,
} from './remi.models';
import { map, Observable } from 'rxjs';
import { UsageAggregation } from '../../db.models';

export class ActivityMonitor {
  kb: WritableKnowledgeBox;
  nuclia: INuclia;

  constructor(kb: WritableKnowledgeBox, nuclia: INuclia) {
    this.kb = kb;
    this.nuclia = nuclia;
  }

  /**
   * Get the evolution of REMi scores of a KB on the specified time range.
   *
   * @param from Timestamp of the moment from which we want the metrics.
   * @param to Timestamp of the moment until which we want the metrics. When not provided, the metrics are returned "until now".
   * @param aggregation Define how the metrics are aggregated. By default, the endpoint returns only one point aggregating all the data for the specified date range. But you can have one point by:
   * - "hour"
   * - "day"
   * - "week"
   * - "month"
   * - "quarter"
   * - "year"
   * - "millennium" (used by default)
   */
  getRemiScores(from: string, to?: string, aggregation?: UsageAggregation): Observable<RemiScoresResponseItem[]> {
    const params = [`from=${from}`];
    if (to) {
      params.push(`to=${to}`);
    }
    if (aggregation) {
      params.push(`aggregation=${aggregation}`);
    }
    return this.nuclia.rest.get<RemiScoresResponseItem[]>(`${this.kb.path}/remi/scores?${params.join('&')}`);
  }

  /**
   * Get a list of RAG requests and their scores that matches a REMi scores query.
   *
   * @param criteria Object representing the query to be done. It currently supports querying on context relevance only.
   */
  queryRemiScores(criteria: RemiQueryCriteria): Observable<RemiQueryResponseItem[]> {
    return this.nuclia.rest
      .post<{ data: RemiQueryResponseItem[] }>(`${this.kb.path}/remi/query`, criteria)
      .pipe(map((response) => response.data as RemiQueryResponseItem[]));
  }

  /**
   * Get the RAG request (question and answer), the REMi scores and the full contexts list for a specific item coming from `queryRemiScores` method.
   *
   * @param eventId Identifier of an item from `queryRemiScores` response.
   */
  getFullContexts(eventId: number): Observable<RemiQueryResponseContextDetails> {
    return this.nuclia.rest.get<RemiQueryResponseContextDetails>(`${this.kb.path}/remi/events/${eventId}`);
  }
}
