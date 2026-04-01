import { ActivityLogItem } from '@nuclia/core';

/**
 * Defines a single column in the metrics table.
 * Each page provides its own set of columns; this model is shared across all 4 pages.
 */
export interface MetricsColumnDef {
  /** Field key used to identify the column (matches ActivityLogItem keys where possible) */
  key: string;

  /** i18n translation key displayed as the column header */
  label: string;

  /** Extracts the display value from a log item. Return null to display an em-dash. */
  value: (item: ActivityLogItem) => string | number | null | undefined;

  /**
   * Column width. Wide columns (long text like question/answer) should use '400px'.
   * Defaults to '180px'.
   */
  width?: string;

  /** Whether this column is hidden by default (user can toggle it back on). */
  defaultHidden?: boolean;

  /** If true, this column appears in the search bar mode selector. Only string-filterable columns should be searchable. */
  searchable?: boolean;

  /** If true, this column is not shown in the table at all — only in the side panel. */
  sidebarOnly?: boolean;

  /** Group name for sidebar section grouping. Maps to i18n key 'activity.detail.group.{group}' */
  group?: string;

  /**
   * Optional inline action button rendered inside this cell (to the right of the value).
   * When set, the cell content is wrapped in a flex row with the value on the left and the
   * button on the right. The button emits `rowActionTriggered` on the parent metrics-page.
   */
  inlineAction?: {
    /** pa-icon glyph name, e.g. 'bulb' */
    icon: string;
    /** i18n key used as the button tooltip */
    tooltip: string;
    /** Return true to show the button for a given row item */
    visible: (item: ActivityLogItem) => boolean;
  };
}

/** Extra fields shown only in the detail side panel, not tied to column definitions */
export interface MetricsSidebarField {
  key: string;
  label: string;
  value: (item: ActivityLogItem) => string | number | null | undefined;
  /** If true, render as an expandable section */
  expandable?: boolean;
  /** Group name for sidebar section grouping */
  group?: string;
}

/** Month range selected in the toolbar date picker.  Both values are YYYY-MM strings. */
export interface MetricsMonthRange {
  from: string;
  to: string;
}

/** A processing-activity row — extends ActivityLogItem with a display-only status label. */
export type ProcessingItem = ActivityLogItem & { _displayStatus?: string };

/** A usage-analytics row — extends ActivityLogItem with display status and individual REMi scores. */
export type UsageAnalyticsItem = ActivityLogItem & {
  _displayStatus?: string;
  _remiScore?: number | null;
  _remiAnswerRelevance?: number | null;
  _remiContextRelevance?: number | null;
  _remiGroundedness?: number | null;
  _rawStatus?: string | null;
};

/** Aggregated cost/token usage stats for the selected month. */
export interface CostTokenStats {
  aiTokensUsed: number | null;
  nucliaTokens: number | null;
  nucliaTokensBilled: number | null;
}

/** Aggregated processing usage stats for the selected month. */
export interface ProcessingStats {
  resourcesProcessed: number | null;
  paragraphsProcessed: number | null;
}
