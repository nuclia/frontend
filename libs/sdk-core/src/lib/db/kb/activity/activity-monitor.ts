import type { WritableKnowledgeBox } from '../kb';
import type { INuclia } from '../../../models';
import {
  ActivityLogDownload,
  ActivityLogDownloadQuery,
  DownloadFormat,
  EventType,
  RemiQueryCriteria,
  RemiQueryResponse,
  RemiQueryResponseContextDetails,
  RemiScoresResponseItem,
  SearchMetricsItem,
} from './activity.models';
import { Observable } from 'rxjs';
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
   * Get a list of RAG requests and their scores (if any) that matches a REMi scores query or a status.
   *
   * @param criteria Object representing the query to be done. It currently supports querying on context relevance, answer status or answer feedback.
   */
  queryRemiScores(criteria: RemiQueryCriteria): Observable<RemiQueryResponse> {
    return this.nuclia.rest.post<RemiQueryResponse>(`${this.kb.path}/remi/query`, criteria);
  }

  /**
   * Get the RAG request (question and answer), the REMi scores and the full contexts list for a specific item coming from `queryRemiScores` method.
   *
   * @param eventId Identifier of an item from `queryRemiScores` response.
   */
  getFullContexts(eventId: number): Observable<RemiQueryResponseContextDetails> {
    return this.nuclia.rest.get<RemiQueryResponseContextDetails>(`${this.kb.path}/remi/events/${eventId}`);
  }

  /**
   * Create a URL to download activity log data
   *
   * @param eventType
   * @param query
   * @param format
   */
  createActivityLogDownload(
    eventType: EventType,
    query: ActivityLogDownloadQuery,
    format: DownloadFormat,
  ): Observable<ActivityLogDownload> {
    return this.nuclia.rest.post<ActivityLogDownload>(`${this.kb.path}/activity/${eventType}/query/download`, query, {
      accept: format,
    });
  }

  /**
   * Get the status of a download request
   *
   * @param requestId
   */
  getDownloadStatus(requestId: string): Observable<ActivityLogDownload> {
    return this.nuclia.rest.get<ActivityLogDownload>(`${this.kb.path}/activity/download_request/${requestId}`);
  }

  /**
   * Get the list of months with available activity log data for a specific event type
   *
   * @param eventType
   */
  getMonthsWithActivity(eventType: EventType): Observable<{ downloads: string[] }> {
    return this.nuclia.rest.get<{ downloads: string[] }>(`${this.kb.path}/activity/${eventType}/months`);
  }

  /**
   * Retrieve statistics for search and ask requests
   *
   * @param from Timestamp of the moment from which we want the metrics.
   * @param to Timestamp of the moment until which we want the metrics. When not provided, the metrics are returned "until now".
   * @param aggregation Define how the metrics are aggregated. By default, the endpoint returns only one point aggregating all the data for the specified date range.
   */
  getSearchMetrics(from: string, to?: string, aggregation?: UsageAggregation): Observable<SearchMetricsItem[]> {
    const params = [`from=${from}`];
    if (to) {
      params.push(`to=${to}`);
    }
    if (aggregation) {
      params.push(`aggregation=${aggregation}`);
    }
    return this.nuclia.rest.get<SearchMetricsItem[]>(`${this.kb.path}/activity/metrics?${params.join('&')}`);
  }
}
