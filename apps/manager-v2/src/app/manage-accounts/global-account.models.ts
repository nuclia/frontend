import { Language } from '@flaps/core';
import {
  Account,
  AccountBlockingState,
  AccountConfig,
  AccountLimitsPatchPayload,
  AccountTypes,
  UserType,
  WelcomeUser,
  WorkflowType,
} from '@nuclia/core';
import { AccountLabels, DedicatedProcessorsState } from './regional-account.models';
import { ZoneVisibility } from '../manage-zones/zone.models';

export interface AccountSummary {
  id: string;
  data: unknown;
  slug: string;
  title: string;
  type: string;
  created: string;
  email: string;
}

export interface AccountUser {
  id: string;
  last_login?: string;
  last_login_ip?: string;
  avatar?: string;
  email: string;
  name: string;
  type: UserType;
  language?: Language;
  created: string;
  modified?: string;
  data?: unknown;
}

export interface ExtendedAccount extends Account, AccountConfig {
  creator: string;
  email: string;
  created: string;
  modified: string;
  managers: string[];
  members: string[];
  users: AccountUser[];
  stashes: AccountKbList;
  dedicated_processors_state: DedicatedProcessorsState;
}

export type AccountUserType = 'manager' | 'member';

export interface AccountCreationPayload {
  slug: string;
  email: string;
  zone: string;
  title?: string;
}

export interface AccountPatchPayload {
  slug?: string;
  email?: string;
  creator?: string;
  type?: string;
  dedicated_processors_state?: string;
  kbs?: number;
  memories?: number;
  agents?: number;
  max_dedicated_processors?: number;
  data?: object;
  blocking_state?: AccountBlockingState;
  limits?: AccountLimitsPatchPayload;
  trial_expiration_date?: string | null;
  allow_access_non_enterprise_models?: boolean;
  labels?: AccountLabels | null;
  workflow?: WorkflowType;
  zone_visibility?: ZoneVisibility;
}

export interface AccountKbList {
  max_stashes: number;
  items: KnowledgeBox[] | null;
}

export type KbStates = 'PUBLISHED' | 'PRIVATE';
export type KbRoles = 'SOWNER' | 'SMEMBER' | 'SCONTRIBUTOR';

export interface KbUser extends WelcomeUser {
  id: string;
}

export interface KbSummary {
  id: string;
  slug: string;
  title: string;
  members: KbUser[];
  contributors: KbUser[];
  owners: KbUser[];
  created: string;
  modified: string;
  zone: string;
}

export interface KnowledgeBox {
  id: string;
  slug: string;
  title: string;
  description?: string;
  avatar?: string;
  state: KbStates;
  account: string;
  creator: string;
  zone: string;
  created: string;
  modified: string;
  data: unknown;
}

export enum BlockedFeature {
  UPLOAD = 'upload',
  PROCESSING = 'processing',
  SEARCH = 'search',
  GENERATIVE = 'generative',
}

export interface BlockedFeaturesPayload {
  blocking_state: AccountBlockingState;
  blocked_features: BlockedFeature[];
}

export interface SearchPrice {
  id: string;
  nickname: string;
  product: string;
}

export interface BillingFormula {
  id: string;
  title: string;
  description: string;
  created: string;
  formula: string[];
}

export type ActionOnBudgetExhausted = 'WARN_ACCOUNT_OWNER' | 'BLOCK_ACCOUNT';

export interface BaseSubscriptionPayload {
  nuclia_tokens_price: number;
  billing_formula_id?: string;
  free_tokens_per_billing_cycle?: number;
  free_storage_nuclia_tokens?: number | null;
  on_demand_budget?: number | null;
  action_on_budget_exhausted?: ActionOnBudgetExhausted | null;
}

export interface CloudZeroSubscriptionPayload extends BaseSubscriptionPayload {
  product: string;
  product_line: string;
  business_unit: string;
}

export type ManualSubscriptionPayload = BaseSubscriptionPayload;

export type ManagerSubscriptionProvider =
  | 'MANUAL'
  | 'CLOUD_ZERO'
  | 'STRIPE'
  | 'AWS_MARKETPLACE'
  | 'NO_SUBSCRIPTION'
  | string;

export interface ManagerSubscriptionDetails {
  status?: string;
  on_demand_budget?: number | null;
  action_on_budget_exhausted?: ActionOnBudgetExhausted | null;
  free_tokens_per_billing_cycle?: number;
  nuclia_tokens_price?: number;
  billing_formula_id?: string;
  free_storage_nuclia_tokens?: number | null;
  product?: string;
  product_line?: string;
  business_unit?: string;
}

export interface ManagerAccountSubscription {
  provider: ManagerSubscriptionProvider;
  subscription: ManagerSubscriptionDetails;
}

export type PaymentCurrency = 'usd' | 'eur';

export interface PaymentLinkPayload {
  account_id: string;
  account_type: AccountTypes;
  price_ids: string[];
  billing_formula_id: string;
  allow_promotion_codes?: boolean;
  currency: PaymentCurrency;
}
