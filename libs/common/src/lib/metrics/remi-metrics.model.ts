import { RemiScoresResponseItem, UsageAggregation } from '@nuclia/core';

// ── Score status ─────────────────────────────────────────────────────────────

export type RemiScoreStatus = 'good' | 'needs-review' | 'poor' | 'no-data';

/** i18n key for the human-readable score label. */
export type RemiScoreLabelKey =
  | 'metrics.remi.status.good'
  | 'metrics.remi.status.needs-review'
  | 'metrics.remi.status.poor'
  | 'metrics.remi.status.no-data';

export type RemiScoreClass = 'remi-high' | 'remi-mid' | 'remi-low' | 'remi-no-data';

export interface RemiScoreDisplay {
  normalizedScore: number | null;
  displayValue: string;
  /** i18n key — use `| translate` in templates, `translate.instant(labelKey)` in TS. */
  labelKey: RemiScoreLabelKey;
  status: RemiScoreStatus;
  cssClass: RemiScoreClass;
}

// ── Issue keys ───────────────────────────────────────────────────────────────

/** Typed key identifying the REMi issue category for a query. */
export type RemiIssueKey =
  | 'context-weak'
  | 'grounding-weak'
  | 'answer-weak'
  | 'no-answer'
  | 'no-major-issue'
  | 'no-data';

// ── Metric keys ──────────────────────────────────────────────────────────────

export type RemiMetricKey = 'answer' | 'context' | 'groundedness';

// ── Display component types ───────────────────────────────────────────────────

export type RemiDisplayMode = 'full' | 'compact' | 'badge';
export type RemiSourceScale = 'auto' | '0-1' | '0-5' | '0-100';

// ── Period ───────────────────────────────────────────────────────────────────

export type RemiPeriods = '24h' | '7d' | '14d' | '30d';

// ── Aggregates & results ─────────────────────────────────────────────────────

export interface RemiHealthAggregate {
  answerRelevance: number | null;
  contextRelevance: number | null;
  groundedness: number | null;
  overall: number | null;
}

// ── Score guide ───────────────────────────────────────────────────────────────

export interface RemiScoreGuideItem {
  readonly status: RemiScoreStatus;
  /** Representative value used to render the badge colour (centre of the range). */
  readonly exampleValue: number;
  readonly rangeKey: string;
}

// ── Issue config entry ────────────────────────────────────────────────────────

export interface RemiIssueConfigEntry {
  labelKey: string;
  mainIssueKey: string;
  whyKey: string;
  recommendedActionKey: string;
  severity: RemiScoreStatus;
}

// ── Query types ───────────────────────────────────────────────────────────────
export interface RangeParameters {
  aggregation: UsageAggregation;
  from: string;
  to?: string;
}

export interface RawEvolutionResults {
  results: RemiScoresResponseItem[];
  parameters: RangeParameters;
}

export type RemiScoreMetric = RemiScoresResponseItem['metrics'][number];

// ── Diagnosis ────────────────────────────────────────────────────────────────

/** Resolved REMi diagnosis returned by remiDiagnosisResolver. All string fields are i18n keys. */
export interface RemiDiagnosis {
  score: number | null | undefined;
  severity: RemiScoreStatus;
  issueKey: RemiIssueKey;
  labelKey: string;
  mainIssueKey: string;
  whyKey: string;
  recommendedActionKey: string;
}
