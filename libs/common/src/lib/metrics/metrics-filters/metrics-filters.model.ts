export type FilterColumnType = 'numeric' | 'boolean' | 'date';
export type DateMode = 'date' | 'range';

export interface FilterColumnConfig {
  key: string;
  labelKey: string;
  type: FilterColumnType;
  allowedOperations?: NumericOperation[];
}

export type NumericOperation = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le';
export type DateOperation = 'ge' | 'le' | 'eq';

export interface NumericCondition {
  column: string;
  operation: NumericOperation;
  value: number;
}

export interface BooleanCondition {
  column: string;
  value: boolean;
}

export interface DateCondition {
  column: string;
  from?: string;  // YYYY-MM-DD
  to?: string;    // YYYY-MM-DD
}

export interface FilterApplyEvent {
  syntheticStatuses?: string[];
  booleanConditions: BooleanCondition[];
  numericConditions: NumericCondition[];
  dateConditions: DateCondition[];
}

export interface ConditionRow {
  id: number;
  column: string;
  columnType: FilterColumnType | null;
  operation: NumericOperation;
  numericValue: string;
  booleanValue: boolean;
  dateValue: string;       // YYYY-MM-DD or ''
  dateTime: string;        // HH:mm (only relevant for ge/le; ignored for eq)
  dateOperation: DateOperation;
}
