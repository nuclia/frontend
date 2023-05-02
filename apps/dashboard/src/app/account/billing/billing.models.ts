import { AccountTypes } from '@nuclia/core';

export type Currency = 'USD' | 'EUR';
export type UsageType =
  | 'qa'
  | 'media'
  | 'searches'
  | 'self-hosted-qa'
  | 'self-hosted-predict'
  | 'self-hosted-processed-paragraphs'
  | 'self-hosted-processed-documents'
  | 'training-hours'
  | 'paragraphs'
  | 'files'; // this last one does not existing in the backend response, we calculate it from paragraphs

export interface Prices {
  recurring: {
    month: { price: number };
    year: { price: number };
  };
  usage: {
    [key in UsageType]: Usage;
  };
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
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export interface PaymentMethod {
  payment_method_id: string;
  payment_method_type: string;
}

export interface StripeSubscriptionCreation {
  payment_method_id: string;
  on_demand_budget: number;
  billing_interval?: RecurrentPriceInterval;
  account_type: AccountTypes;
}

export interface StripeSubscription {
  subscription_id: string;
  payment_method_id: string;
  status: 'active' | 'incomplete';
  requires_action: boolean;
  client_secret: string;
  error?: { code: string; decline_code: string };
}

export enum SubsciptionError {
  INVALID_ADDRESS = 'customer_tax_location_invalid',
  PAYMENT_METHOD_NOT_ATTACHED = 'payment_method_not_attached',
}

export interface AccountTypeDefaults {
  max_kbs: number;
  max_dedicated_processors: number;
  max_trial_days: number;
  monthly_limit_paragraphs_processed: number;
  monthly_limit_docs_no_media_processed: number;
  monthly_limit_media_seconds_processed: number;
  monthly_limit_paragraphs_stored: number;
  monthly_limit_hosted_searches_performed: number;
  monthly_limit_hosted_answers_generated: number;
  monthly_limit_self_hosted_searches_performed: number;
  monthly_limit_self_hosted_answers_generated: number;
  upload_limit_max_media_file_size: number;
  upload_limit_max_non_media_file_size: number;
}

export interface InvoiceItem {
  threshold: number;
  current_usage: number;
  price: number;
  over_usage: number;
  over_cost: number;
}

export interface AccountUsage {
  budget: number;
  currency: Currency;
  invoice_items: { [key in UsageType]: InvoiceItem };
  start_billing_date: string;
  end_billing_date: string;
}
