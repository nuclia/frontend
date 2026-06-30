import { ActivityLogItem } from '@nuclia/core';

/**
 * Strategy object that extends MetricsPageComponent with domain-specific
 * cell rendering logic and sidebar group customization.
 *
 * Implement this interface to plug in custom column handling without modifying
 * the generic component. Pair with a `customCellTemplate` TemplateRef input
 * for the actual rendering — the same pattern as `afterGroupTemplate`.
 */
export interface MetricsCellPlugin {
  /** True if the column needs custom rendering via `customCellTemplate`. */
  isCustomColumn(key: string): boolean;

  // ── Sidebar group customization ─────────────────────────────────────────
  /** Override the i18n label key for a sidebar group, or null to use default. */
  getGroupLabelKey(group: string): string | null;
  /** Filter fields shown in a sidebar group. Return the full array to keep all. */
  filterGroupFields<T extends { key: string }>(group: string, fields: T[]): T[];
}

/**
 * Strategy object for injecting extra sidebar sections after a named group.
 * Pair with an `afterGroupTemplate` TemplateRef on MetricsPageComponent.
 *
 * The template receives context `{ $implicit: data, item }` where `data` is
 * whatever `getAfterGroupData` returns — the caller owns both the plugin and
 * the template, so the concrete shape is typed there.
 */
export interface MetricsSidebarPlugin {
  /** Whether extra content should appear after this group for this item. */
  shouldShowAfterGroup(group: string, item: ActivityLogItem): boolean;
  /** Data passed as `$implicit` to the `afterGroupTemplate`. */
  getAfterGroupData(group: string, item: ActivityLogItem): unknown;
}
