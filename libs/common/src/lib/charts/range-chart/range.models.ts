export interface RangeChartData {
  category: string;
  average: number;
  min: number;
  max: number;
  /** Optional per-category color. When set, overrides the default CSS class styling. */
  color?: string;
}

export interface DatedRangeChartData {
  timestamp: string;
  average: number;
  min: number;
  max: number;
}
