import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { map, Observable, switchMap, take } from 'rxjs';
import { AccountTypes } from '@nuclia/core';
import { Currency, Prices } from './billing.models';

export interface StripeCustomer {
  customer_id: string;
  billing_details: BillingDetails;
}

export interface BillingDetails {
  name: string;
  company: string;
  vat?: string;
  address: string;
  country: string;
  state?: string;
  city: string;
  postal_code: string;
}

enum RecurrentPriceInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export interface StripeSubscription {
  payment_method_id: string;
  on_demand_budget: number;
  billing_interval?: RecurrentPriceInterval;
  account_type: AccountTypes;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  type = this.sdk.currentAccount.pipe(map((account) => account.type));

  constructor(private sdk: SDKService) {}

  getCustomer(): Observable<StripeCustomer> {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.rest.get<StripeCustomer>(`/billing/account/${account.id}/customer`)),
    );
  }

  createCustomer(data: BillingDetails) {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) =>
        this.sdk.nuclia.rest.put<StripeCustomer>(`/billing/account/${account.id}/customer`, {
          billing_details: data,
        }),
      ),
    );
  }

  modifyCustomer(data: Partial<BillingDetails>) {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) =>
        this.sdk.nuclia.rest.patch<void>(`/billing/account/${account.id}/customer`, {
          billing_details: data,
        }),
      ),
    );
  }

  getStripePublicKey() {
    return this.sdk.nuclia.rest.get<{ public_key: string }>(`/auth/stripe/public`);
  }

  createSubscription(data: StripeSubscription) {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.rest.put<void>(`/billing/account/${account.id}/subscription`, data)),
    );
  }

  getCurrency(country: string): Observable<Currency> {
    return this.sdk.nuclia.rest
      .get<{ currency: string }>(`/billing/currencies?country=${country}`)
      .pipe(map((res) => res.currency.toUpperCase() as Currency));
  }

  getPrices(): Observable<{ [key in AccountTypes]: Prices }> {
    return this.sdk.nuclia.rest.get<{ [key in AccountTypes]: Prices }>(`/billing/tiers`).pipe(
      map((res) => {
        return Object.keys(res).reduce((acc, key) => {
          acc[key as AccountTypes] = {
            ...res[key as AccountTypes],
            usage: {
              ...res[key as AccountTypes].usage,
              files: {
                price: res[key as AccountTypes].usage.paragraphs.price * 140,
                threshold: Math.floor(res[key as AccountTypes].usage.paragraphs.threshold / 140),
              },
            },
          };
          return acc;
        }, {} as { [key in AccountTypes]: Prices });
      }),
    );
  }
}
