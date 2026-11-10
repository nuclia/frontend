import { AccountTypes, WorkflowType } from '@nuclia/core';
import { AccountBudget, ActionOnBudgetExhausted } from '../../global-account.models';
import { UNLIMITED } from '../account-details.utils';

export const ACCOUNT_TYPE_OPTIONS: { value: AccountTypes; label: string }[] = [
  { value: 'stash-trial', label: 'Trial' },
  { value: 'cowork', label: 'Cowork' },
  { value: 'v3starter', label: 'Starter v3' },
  { value: 'v3fly', label: 'Fly v3' },
  { value: 'v3growth', label: 'Growth v3' },
  { value: 'v3pro', label: 'Pro v3' },
  { value: 'v3enterprise', label: 'Enterprise v3' },
];

export const WORKFLOW_OPTIONS: { value: WorkflowType; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'cowork', label: 'Cowork' },
];

export function toMaxValue(mode: 'limit' | 'unlimited', max: number): number {
  return mode === 'limit' ? max : UNLIMITED;
}

export function toBudgetPayload(raw: {
  custom_budget: 'limit' | 'unlimited';
  budget_value: number | null;
  action_on_budget_exhausted: ActionOnBudgetExhausted;
}): AccountBudget {
  return raw.custom_budget === 'limit'
    ? { budget_value: raw.budget_value, action_on_budget_exhausted: raw.action_on_budget_exhausted }
    : { budget_value: null, action_on_budget_exhausted: null };
}

export function isBudgetChanged(backup: AccountBudget | null, payload: AccountBudget): boolean {
  return (
    backup?.budget_value !== payload.budget_value ||
    backup?.action_on_budget_exhausted !== payload.action_on_budget_exhausted
  );
}
