export interface SimpleFilter {
  type: string;
  value: string;
}

export type FilterCombiner = 'all' | 'any' | 'none' | 'not_all';
export interface FilterExpression {
  combine: FilterCombiner;
  filters: SimpleFilter[];
}
