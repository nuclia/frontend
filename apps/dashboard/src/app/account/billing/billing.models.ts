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
