import { ActionOnBudgetExhausted, BaseSubscriptionPayload, ProductCatalog } from '../../global-account.models';
import { SelectOption } from './subscriptions.model';

export const CLOUD_ZERO_FORMULA_ID = '00000000-0000-4000-8000-000000000002';
export const MANUAL_FORMULA_ID = '00000000-0000-4000-8000-000000000001';

export const ACTION_ON_BUDGET_OPTIONS: { value: ActionOnBudgetExhausted; label: string }[] = [
  { value: 'WARN_ACCOUNT_OWNER', label: 'Warn account owner' },
  { value: 'BLOCK_ACCOUNT', label: 'Block account' },
];

export function hasBudget(value: number | string | null | undefined): boolean {
  return value !== null && value !== undefined && value !== '' && Number(value) > 0;
}

export function nullOrNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  return Number(value);
}

export function getOptionLabel(options: { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function buildBasePayload(raw: {
  nuclia_tokens_price: number | null;
  billing_formula_id: string;
  free_tokens_per_billing_cycle: number | null;
  free_storage_nuclia_tokens: number | null;
  on_demand_budget: number | null;
  action_on_budget_exhausted: ActionOnBudgetExhausted | null;
}): BaseSubscriptionPayload {
  const freeTokens = nullOrNumber(raw.free_tokens_per_billing_cycle);
  const freeStorage = nullOrNumber(raw.free_storage_nuclia_tokens);
  const budget = nullOrNumber(raw.on_demand_budget);
  return {
    nuclia_tokens_price: raw.nuclia_tokens_price ?? 0,
    ...(raw.billing_formula_id ? { billing_formula_id: raw.billing_formula_id } : {}),
    ...(freeTokens !== null ? { free_tokens_per_billing_cycle: freeTokens } : {}),
    ...(freeStorage !== null ? { free_storage_nuclia_tokens: freeStorage } : {}),
    ...(budget !== null ? { on_demand_budget: budget } : {}),
    ...(raw.action_on_budget_exhausted != null ? { action_on_budget_exhausted: raw.action_on_budget_exhausted } : {}),
  };
}

export function getBusinessUnitOptions(catalog: ProductCatalog): SelectOption[] {
  return Object.entries(catalog).map(([key, value]) => ({ value: key, label: value.name || key }));
}

export function getProductLineOptions(catalog: ProductCatalog, businessUnit: string): SelectOption[] {
  if (!businessUnit) {
    return [];
  }
  return Object.entries(catalog[businessUnit]?.product_lines || {}).map(([key, value]) => ({
    value: key,
    label: value.name || key,
  }));
}

export function getProductOptions(catalog: ProductCatalog, businessUnit: string, productLine: string): SelectOption[] {
  if (!businessUnit || !productLine) {
    return [];
  }
  return Object.entries(catalog[businessUnit]?.product_lines[productLine]?.products || {}).map(([key, value]) => ({
    value: key,
    label: value.name || key,
  }));
}
