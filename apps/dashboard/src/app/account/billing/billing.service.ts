import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';
import { AccountTypes } from '@nuclia/core';
import {
  AccountSubscription,
  AccountUsage,
  BillingDetails,
  Currency,
  InvoicesList,
  PaymentMethod,
  Prices,
  StripeCustomer,
  StripeSubscription,
  StripeSubscriptionCancellation,
  StripeSubscriptionCreation,
} from './billing.models';

export const UPGRADABLE_ACCOUNT_TYPES: AccountTypes[] = ['stash-trial', 'stash-starter'];

@Injectable({ providedIn: 'root' })
export class BillingService {
  type = this.sdk.currentAccount.pipe(map((account) => account.type));
  isSubscribed = combineLatest([this.type, this.getPrices()]).pipe(
    switchMap(([type, prices]) => {
      if (type === 'stash-enterprise') {
        // Not all enterprise accounts are subscribed
        return this.getSubscription().pipe(map((subscription) => subscription !== null));
      } else {
        return of(Object.keys(prices).includes(type as string));
      }
    }),
    shareReplay(1),
  );

  private _initialCurrency = new BehaviorSubject<Currency>('USD');
  initialCurrency = this._initialCurrency.asObservable();

  constructor(private sdk: SDKService) {}

  setInitialCurrency(currency: Currency) {
    this._initialCurrency.next(currency);
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

  getSubscription(): Observable<AccountSubscription | null> {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) =>
        this.sdk.nuclia.rest.get<AccountSubscription>(`/billing/account/${account.id}/subscription`),
      ),
      catchError(() => of(null)),
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

  cancelSubscription(data: StripeSubscriptionCancellation) {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) =>
        this.sdk.nuclia.rest.post<void>(`/billing/account/${account.id}/subscription/cancel`, data),
      ),
    );
  }

  reactivateSubscription() {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) =>
        this.sdk.nuclia.rest.post<void>(`/billing/account/${account.id}/subscription/reactivate`, undefined),
      ),
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
        return Object.keys(res).reduce(
          (acc, key) => {
            const usage = res[key as AccountTypes].usage;
            if (usage.paragraphs) {
              acc[key as AccountTypes] = {
                ...res[key as AccountTypes],
                usage: {
                  ...usage,
                  files: {
                    price: usage.paragraphs.price * 140,
                    threshold: Math.floor(usage.paragraphs.threshold / 140),
                  },
                  media: {
                    price: usage.media.price * 60,
                    threshold: Math.floor(usage.media.threshold / 60),
                  },
                  training: {
                    price: usage.training.price * 60,
                    threshold: Math.floor(usage.training.threshold / 60),
                  },
                },
              };
            } else {
              acc[key as AccountTypes] = res[key as AccountTypes];
            }

            return acc;
          },
          {} as { [key in AccountTypes]: Prices },
        );
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
          training: {
            ...usage.invoice_items.training,
            threshold: Math.floor(usage.invoice_items.training.threshold / 60),
            current_usage: Math.ceil((usage.invoice_items.training.current_usage / 60) * 10) / 10,
            over_usage: Math.ceil((usage.invoice_items.training.over_usage / 60) * 10) / 10,
          },
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
