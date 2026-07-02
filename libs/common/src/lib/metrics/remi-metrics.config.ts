import {
  RemiIssueConfigEntry,
  RemiIssueKey,
  RemiScoreDisplay,
  RemiScoreGuideItem,
  RemiScoreStatus,
} from './remi-metrics.model';

// ── Issue config ──────────────────────────────────────────────────────────────

/** Declarative config for each issue key: i18n keys + severity. */
export const REMI_ISSUE_CONFIG: Record<RemiIssueKey, RemiIssueConfigEntry> = {
  'context-weak': {
    labelKey: 'metrics.remi.issue.context-weak.label',
    mainIssueKey: 'metrics.remi.issue.context-weak.main-issue',
    whyKey: 'metrics.remi.issue.context-weak.why',
    recommendedActionKey: 'metrics.remi.issue.context-weak.recommended-action',
    severity: 'needs-review',
  },
  'grounding-weak': {
    labelKey: 'metrics.remi.issue.grounding-weak.label',
    mainIssueKey: 'metrics.remi.issue.grounding-weak.main-issue',
    whyKey: 'metrics.remi.issue.grounding-weak.why',
    recommendedActionKey: 'metrics.remi.issue.grounding-weak.recommended-action',
    severity: 'needs-review',
  },
  'answer-weak': {
    labelKey: 'metrics.remi.issue.answer-weak.label',
    mainIssueKey: 'metrics.remi.issue.answer-weak.main-issue',
    whyKey: 'metrics.remi.issue.answer-weak.why',
    recommendedActionKey: 'metrics.remi.issue.answer-weak.recommended-action',
    severity: 'needs-review',
  },
  'no-answer': {
    labelKey: 'metrics.remi.issue.no-answer.label',
    mainIssueKey: 'metrics.remi.issue.no-answer.main-issue',
    whyKey: 'metrics.remi.issue.no-answer.why',
    recommendedActionKey: 'metrics.remi.issue.no-answer.recommended-action',
    severity: 'poor',
  },
  'no-major-issue': {
    labelKey: 'metrics.remi.issue.no-major-issue.label',
    mainIssueKey: 'metrics.remi.issue.no-major-issue.main-issue',
    whyKey: 'metrics.remi.issue.no-major-issue.why',
    recommendedActionKey: 'metrics.remi.issue.no-major-issue.recommended-action',
    severity: 'good',
  },
  'no-data': {
    labelKey: 'metrics.remi.issue.no-data.label',
    mainIssueKey: 'metrics.remi.issue.no-data.main-issue',
    whyKey: 'metrics.remi.issue.no-data.why',
    recommendedActionKey: 'metrics.remi.issue.no-data.recommended-action',
    severity: 'no-data',
  },
};

// ── Metric keys & field map ───────────────────────────────────────────────────

export const REMI_METRIC_KEYS = ['answer', 'context', 'groundedness'] as const;

/** Maps column keys to the UsageAnalyticsItem private field that holds the raw value. */
export const REMI_FIELD_MAP: Record<
  string,
  '_remiScore' | '_remiAnswerRelevance' | '_remiContextRelevance' | '_remiGroundedness'
> = {
  remiScore: '_remiScore',
  answerRelevance: '_remiAnswerRelevance',
  contentRelevance: '_remiContextRelevance',
  groundedness: '_remiGroundedness',
};

// ── Score guide ───────────────────────────────────────────────────────────────

/** Ordered tiers used to render the score guide legend, best → worst. */
export const REMI_SCORE_GUIDE: RemiScoreGuideItem[] = [
  { status: 'good', exampleValue: 90, rangeKey: 'metrics.remi.guide.range.good' },
  { status: 'needs-review', exampleValue: 65, rangeKey: 'metrics.remi.guide.range.needs-review' },
  { status: 'poor', exampleValue: 30, rangeKey: 'metrics.remi.guide.range.poor' },
];

// ── Score display functions ───────────────────────────────────────────────────

/**
 * Normalizes REMi values coming from mixed scales into a 0-100 display scale.
 * Supported inputs:
 *  - 0..1   (fractional)
 *  - 0..5   (score)
 *  - 0..100 (percentage)
 *  - null/undefined (no data)
 */
export function getRemiScoreDisplay(rawValue: number | null | undefined): RemiScoreDisplay {
  if (rawValue === null || rawValue === undefined) {
    return {
      normalizedScore: null,
      displayValue: '—',
      labelKey: 'metrics.remi.status.no-data',
      status: 'no-data',
      cssClass: 'remi-no-data',
    };
  }

  const as100Scale = rawValue <= 1 ? rawValue * 100 : rawValue <= 5 ? (rawValue / 5) * 100 : rawValue;
  const normalizedScore = Math.round(Math.max(0, Math.min(100, as100Scale)));

  if (normalizedScore >= 80) {
    return {
      normalizedScore,
      displayValue: `${normalizedScore}%`,
      labelKey: 'metrics.remi.status.good',
      status: 'good',
      cssClass: 'remi-high',
    };
  }

  if (normalizedScore >= 50) {
    return {
      normalizedScore,
      displayValue: `${normalizedScore}%`,
      labelKey: 'metrics.remi.status.needs-review',
      status: 'needs-review',
      cssClass: 'remi-mid',
    };
  }

  return {
    normalizedScore,
    displayValue: `${normalizedScore}%`,
    labelKey: 'metrics.remi.status.poor',
    status: 'poor',
    cssClass: 'remi-low',
  };
}

/**
 * Maps a normalized REMi score to a CSS colour class tier.
 * Returns null when the value is absent so callers can skip styling entirely.
 */
export function getRemiColorClass(val: number | null | undefined): 'low' | 'mid' | 'high' | null {
  const status: RemiScoreStatus = getRemiScoreDisplay(val).status;
  if (status === 'no-data') return null;
  if (status === 'good') return 'high';
  if (status === 'needs-review') return 'mid';
  return 'low';
}
