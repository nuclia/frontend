import { ActivityLogItem } from '@nuclia/core';
import { TranslateService } from '@ngx-translate/core';
import { MetricsCellPlugin, MetricsSidebarPlugin } from './metrics-cell-plugin';
import { UsageAnalyticsItem } from './metrics-column.model';
import { REMI_FIELD_MAP, REMI_ISSUE_CONFIG } from './remi-metrics.config';
import { RemiDiagnosis } from './remi-metrics.model';

// ── Types ────────────────────────────────────────────────────────────────────

export interface RemiSidebarData {
  diagnosis: RemiDiagnosis;
  expandExpected: boolean;
}

// ── Cell plugin ───────────────────────────────────────────────────────────────

/**
 * MetricsCellPlugin implementation for REMi metrics columns.
 * Handles score-display cells (answer/context/groundedness/overall),
 * issue chips, colour-coded text cells, and REMi sidebar group filtering.
 */
export class RemiCellPlugin implements MetricsCellPlugin {
  constructor(private translate: TranslateService) {}

  isCustomColumn(key: string): boolean {
    return key in REMI_FIELD_MAP || key === 'issue';
  }

  /** Exposed for use in `customCellTemplate` — distinguishes score vs chip cells. */
  getCellType(key: string): 'score-display' | 'chip' | null {
    if (key in REMI_FIELD_MAP) return 'score-display';
    if (key === 'issue') return 'chip';
    return null;
  }

  // ── score-display ───────────────────────────────────────────────────────

  getScoreValue(item: ActivityLogItem, key: string): number | null | undefined {
    const field = REMI_FIELD_MAP[key];
    return field ? (item as UsageAnalyticsItem)[field] : undefined;
  }

  // ── chip ────────────────────────────────────────────────────────────────

  getChipCssClass(item: ActivityLogItem, _key: string): string {
    return this._getIssueConfig(item).severity;
  }

  getChipLabelKey(item: ActivityLogItem, _key: string): string {
    return this._getIssueConfig(item).labelKey;
  }

  getChipTitle(item: ActivityLogItem, key: string): string {
    const label = this.translate.instant(this.getChipLabelKey(item, key));
    return this.translate.instant('metrics.remi.issue.chip-label', { label });
  }

  // ── sidebar group ────────────────────────────────────────────────────────

  getGroupLabelKey(group: string): string | null {
    return group === 'remi' ? 'activity.detail.group.remi' : null;
  }

  filterGroupFields<T extends { key: string }>(group: string, fields: T[]): T[] {
    if (group === 'remi') {
      return fields.filter((f) => !['status', 'remiScore', 'issue'].includes(f.key));
    }
    return fields;
  }

  // ── private helpers ───────────────────────────────────────────────────────

  private _getIssueConfig(item: ActivityLogItem) {
    const key = (item as UsageAnalyticsItem)._issueKey ?? 'no-data';
    return REMI_ISSUE_CONFIG[key];
  }
}

// ── Sidebar plugin ────────────────────────────────────────────────────────────

/**
 * MetricsSidebarPlugin implementation that injects the REMi diagnosis card
 * after the 'query' sidebar group when the item has a REMi score.
 */
export class RemiSidebarPlugin implements MetricsSidebarPlugin {
  shouldShowAfterGroup(group: string, item: ActivityLogItem): boolean {
    return group === 'query' && (item as UsageAnalyticsItem)._remiScore !== undefined;
  }

  getAfterGroupData(group: string, item: ActivityLogItem): RemiSidebarData | null {
    if (group !== 'query') return null;
    const usageItem = item as UsageAnalyticsItem;
    if (usageItem._remiScore === undefined) return null;

    const issueKey = usageItem._issueKey ?? 'no-data';
    const config = REMI_ISSUE_CONFIG[issueKey];
    const diagnosis: RemiDiagnosis = {
      score: usageItem._remiScore,
      severity: config.severity,
      issueKey,
      labelKey: config.labelKey,
      mainIssueKey: config.mainIssueKey,
      whyKey: config.whyKey,
      recommendedActionKey: config.recommendedActionKey,
    };
    return { diagnosis, expandExpected: issueKey !== 'no-major-issue' };
  }
}
