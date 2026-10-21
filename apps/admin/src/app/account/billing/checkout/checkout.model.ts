import { Currency, Prices, StripeCustomer } from '@flaps/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { Account, AccountTypes } from '@nuclia/core';
import { Observable } from 'rxjs';

export const CUSTOMER_FORM_ERRORS = {
  required: 'validation.required',
  email: 'validation.email',
  vat: 'billing.invalid_vat',
} as IErrorMessages;

/** Errors whose message is meant for the user: an i18n key or a message coming from Stripe. */
export class CheckoutError extends Error {}

export interface CheckoutPlanDetails {
  account: AccountTypes;
  prices: Prices;
  currency: Currency;
  budget: number | null;
  contextBox?: boolean;
}

export interface CheckoutStrategy {
  details(customer: StripeCustomer): Observable<CheckoutPlanDetails>;
  redirectUrl(account: Account): Observable<string>;
  onError?(message?: string): void;
}
