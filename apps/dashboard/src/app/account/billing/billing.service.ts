import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, take } from 'rxjs';
import { AccountTypes } from '@nuclia/core';
import {
  AccountUsage,
  BillingDetails,
  Currency,
  InvoicesList,
  PaymentMethod,
  Prices,
  StripeCustomer,
  StripeSubscription,
  StripeSubscriptionCreation,
} from './billing.models';

@Injectable({ providedIn: 'root' })
export class BillingService {
  type = this.sdk.currentAccount.pipe(map((account) => account.type));
  isSubscribed = this.type.pipe(map((type) => type === 'stash-developer' || type === 'stash-business'));

  private _country = new BehaviorSubject<string | null>(null);
  country = this._country.asObservable();

  private _budgetEstimation = new BehaviorSubject<number>(0);
  budgetEstimation = this._budgetEstimation.asObservable();

  constructor(private sdk: SDKService) {}

  setCountry(country: string | null) {
    this._country.next(country);
  }

  setBudgetEstimation(budget: number) {
    this._budgetEstimation.next(Math.floor(budget));
  }

  getCustomer(): Observable<StripeCustomer | null> {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.rest.get<StripeCustomer>(`/billing/account/${account.id}/customer`)),
      catchError(() => of(null)),
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
    return this.sdk.nuclia.rest.get<{ public_key: string }>(`/billing/stripe/public`);
  }

  createPaymentMethod(data: { token: string }) {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) =>
        this.sdk.nuclia.rest.post<PaymentMethod>(`/billing/account/${account.id}/payment_methods`, data),
      ),
    );
  }

  createSubscription(data: StripeSubscriptionCreation) {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) =>
        this.sdk.nuclia.rest.put<StripeSubscription>(`/billing/account/${account.id}/subscription`, data),
      ),
    );
  }

  modifySubscription(data: { on_demand_budget: number }) {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.rest.patch<void>(`/billing/account/${account.id}/subscription`, data)),
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
              media: {
                price: res[key as AccountTypes].usage.media.price * 60,
                threshold: Math.floor(res[key as AccountTypes].usage.media.threshold / 60),
              },
              training: res[key as AccountTypes].usage.training
                ? {
                    price: res[key as AccountTypes].usage.training.price * 60,
                    threshold: Math.floor(res[key as AccountTypes].usage.training.threshold / 60),
                  }
                : res[key as AccountTypes].usage['training-hours'],
            },
          };
          return acc;
        }, {} as { [key in AccountTypes]: Prices });
      }),
    );
  }

  getAccountUsage(): Observable<AccountUsage> {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.rest.get<AccountUsage>(`/billing/account/${account.id}/current_usage`)),
      map((usage) => ({
        ...usage,
        currency: usage.currency.toUpperCase() as Currency,
        invoice_items: {
          ...usage.invoice_items,
          media: {
            ...usage.invoice_items.media,
            threshold: Math.floor(usage.invoice_items.media.threshold / 60),
            current_usage: Math.ceil((usage.invoice_items.media.current_usage / 60) * 10) / 10,
            over_usage: Math.ceil((usage.invoice_items.media.over_usage / 60) * 10) / 10,
          },
          training: usage.invoice_items.training
            ? {
                ...usage.invoice_items.training,
                threshold: Math.floor(usage.invoice_items.training.threshold / 60),
                current_usage: Math.ceil((usage.invoice_items.training.current_usage / 60) * 10) / 10,
                over_usage: Math.ceil((usage.invoice_items.training.over_usage / 60) * 10) / 10,
              }
            : usage.invoice_items['training-hours'],
        },
      })),
    );
  }

  getInvoices(limit = 50, lastId?: string): Observable<InvoicesList> {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) =>
        this.sdk.nuclia.rest.get<InvoicesList>(
          `/billing/account/${account.id}/invoices?limit=${limit}` + (lastId ? `&starting_after=${lastId}` : ''),
        ),
      ),
    );
  }
}
