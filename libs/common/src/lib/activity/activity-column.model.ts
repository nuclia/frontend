import { ActivityLogItem } from '@nuclia/core';

/**
 * Defines a single column in the activity log table.
 * Each page provides its own set of columns; this model is shared across all 4 pages.
 */
export interface ActivityColumnDef {
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
}

/** Month range selected in the toolbar date picker.  Both values are YYYY-MM strings. */
export interface ActivityMonthRange {
  from: string;
  to: string;
}
