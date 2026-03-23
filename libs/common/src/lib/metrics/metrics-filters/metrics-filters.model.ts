export type FilterColumnType = 'numeric' | 'boolean';

export interface FilterColumnConfig {
  key: string;
  labelKey: string;
  type: FilterColumnType;
  allowedOperations?: NumericOperation[];
}

export type NumericOperation = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le';

export interface NumericCondition {
  column: string;
  operation: NumericOperation;
  value: number;
}

export interface BooleanCondition {
  column: string;
  value: boolean;
}

export interface FilterApplyEvent {
  syntheticStatuses?: string[];
  booleanConditions: BooleanCondition[];
  numericConditions: NumericCondition[];
}

export interface ConditionRow {
  id: number;
  column: string;
  columnType: FilterColumnType | null;
  operation: NumericOperation;
  numericValue: string;
  booleanValue: boolean;
}
