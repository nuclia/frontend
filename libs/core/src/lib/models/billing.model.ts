import { AccountTypes, UsageMetric, NucliaTokensMetric } from '@nuclia/core';

export type Currency = 'USD' | 'EUR';
export type BillingUsageType =
  | 'nuclia-tokens'
  | 'ai-tokens-used'

  // Deprecated items
  | 'generative'
  | 'media'
  | 'searches'
  | 'predict'
  | 'training'
  | 'paragraphs'
  | 'paragraphs_processed'
  | 'self-hosted-qa'
  | 'qa'
  | 'self-hosted-predict'
  | 'self-hosted-processed-paragraphs'
  | 'self-hosted-processed-documents'
  | 'files'; // this last one does not existing in the backend response, we calculate it from paragraphs

export type BillingUsage = Partial<{ [key in BillingUsageType]: Usage }>;
export interface Prices {
  recurring: {
    month?: { price: number };
    year?: { price: number };
  } | null;
  usage: BillingUsage;
}

export interface Usage {
  threshold: number;
  price: number;
}

export interface StripeCustomer {
  customer_id: string;
  billing_details: BillingDetails;
}

export interface BillingDetails {
  name: string;
  email: string;
  phone: string;
  is_company: boolean;
  company?: string;
  vat?: string;
  address: string;
  country: string;
  state?: string;
  city: string;
  postal_code: string;
}

export enum RecurrentPriceInterval {
  MONTH = 'month',
  YEAR = 'year',
}

export interface PaymentMethod {
  payment_method_id: string;
  payment_method_type: string;
}

export enum SubscriptionStatus {
  NO_SUBSCRIPTION = 'no_subscription',
  PENDING = 'pending',
  ACTIVE = 'active',
  PAYMENT_ISSUES = 'payment_issues',
  CANCEL_SCHEDULED = 'cancel_scheduled',
  CANCELED = 'canceled',
}

export enum CancellationFeedback {
  TOO_EXPENSIVE = 'too_expensive',
  MISSING_FEATURES = 'missing_features',
  SWITCHED_SERVICE = 'switched_service',
  UNUSED = 'unused',
  CUSTOMER_SERVICE = 'customer_service',
  TOO_COMPLEX = 'too_complex',
  LOW_QUALITY = 'low_quality',
  OTHER = 'other',
}

// TODO: 'NO_SUBSCRIPTION' will be replaced by 'MANUAL'. The old value can be removed once it's removed from backend.
export type SubscriptionProvider = 'STRIPE' | 'AWS_MARKETPLACE' | 'NO_SUBSCRIPTION' | 'MANUAL';

export interface AccountSubscription {
  provider: SubscriptionProvider;
  subscription: StripeAccountSubscription | AwsAccountSubscription | AccountBudget;
}

export interface AccountBudget {
  on_demand_budget: number | null;
  action_on_budget_exhausted: 'BLOCK_ACCOUNT' | 'WARN_ACCOUNT_OWNER' | null;
  free_tokens_per_billing_cycle?: number;
}

export interface StripeAccountSubscription extends AccountBudget {
  status: SubscriptionStatus;
  billing_interval: RecurrentPriceInterval;
  start_billing_period: string;
  end_billing_period: string;
}

export interface AwsAccountSubscription extends AccountBudget {
  status: SubscriptionStatus;
  aws_product_code: string;
  aws_product_id?: string;
}

export interface StripeSubscriptionCreation {
  payment_method_id: string;
  on_demand_budget: number | null;
  billing_interval?: RecurrentPriceInterval;
  account_type: AccountTypes;
}

export interface StripeSubscriptionCancellation {
  feedback?: CancellationFeedback;
  comment?: string;
}

export interface StripeSubscription {
  subscription_id: string;
  payment_method_id: string;
  status: 'active' | 'incomplete';
  requires_action: boolean;
  client_secret: string;
  error?: { code: string; decline_code: string };
}

export enum SubscriptionError {
  INVALID_ADDRESS = 'customer_tax_location_invalid',
  PAYMENT_METHOD_NOT_ATTACHED = 'payment_method_not_attached',
}

export interface InvoiceItem {
  threshold: number;
  current_usage: number;
  price: number;
  over_usage: number;
  over_cost: number;
}

export interface AccountUsage {
  budget: number | null;
  currency: Currency;
  invoice_items: { [key in BillingUsageType]: InvoiceItem };
  start_billing_date: string;
  end_billing_date: string;
  over_cost: number;
  consumption?: number;
}

export interface ManualAccountUsage {
  budget: number | null;
  start_billing_date: string;
  end_billing_date: string;
  nuclia_tokens: number;
  nuclia_tokens_price: number;
}

export interface InvoicesListPagination {
  starting_after?: string;
  limit?: number;
  has_more: boolean;
}

export interface Invoice {
  id: string;
  period_start: string;
  period_end: string;
  order_number: string;
  account_type: AccountTypes;
  amount: number;
  pdf: string;
}

export interface InvoicesList {
  items: Invoice[];
  pagination: InvoicesListPagination;
}
