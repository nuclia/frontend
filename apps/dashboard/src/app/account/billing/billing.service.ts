import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { map, Observable, switchMap, take } from 'rxjs';
import { AccountTypes } from '@nuclia/core';

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

export const FEATURES = [
  { title: 'Document thumnails generation', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Document Indexing', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Maximum file size', basic: 'Up to 10 Mb', pro: 'Up to 120 Mb', business: 'Up to 1.5 Gb' },
  { title: 'Number of knowledge boxes', basic: '1', pro: '3', business: '10' },
  { title: 'Search trend topics', basic: '', pro: 'coming soon', business: 'coming soon' },
  { title: 'Videos and audio indexing', basic: '', pro: 'yes', business: 'yes' },
  { title: 'URL indexing', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Multi-language search', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Ranking tuner', basic: '', pro: '', business: 'yes' },
  { title: 'Usage analytics and retention', basic: '', pro: '', business: '90 days' },
  { title: 'Widget system access', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Typo tolerance search', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'NER Detection', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Indexing booster', basic: '', pro: 'yes', business: 'yes' },
  { title: 'Nuclia widget for internal usage', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Self-hosted API key', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Chrome Extension', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Desktop Application for data ingestion', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Data Anonymization', basic: '', pro: '', business: 'yes' },
];

export const PARAMETERS = [
  {
    type: 'Ingest',
    items: [
      { title: 'Extracted & analized paragraphs', free: '1000 paragraph/month', over: '0.0006€ /paragraph' },
      { title: 'Extracted & analized documents', free: '100 documents/month', over: '0.014€ /document' },
      { title: 'Extracted & analized hours video / audio', free: '2 hours/month', over: '7.20€ /hour' },
    ],
  },
  {
    type: 'Training',
    items: [
      { title: 'Classification', free: '0 hours', over: '3€ /hour' },
      { title: 'Question & answering', free: '0 hours', over: '3€ /hour' },
    ],
  },
  {
    type: 'NucliaDB Hosted',
    items: [
      { title: 'Paragraphs stored', free: '4000 paragraphs/month', over: '0.0002€ /paragraph' },
      { title: 'Searches, suggestions and questions', free: '5000 searches/month *', over: '0.0015€ /search' },
    ],
  },
  {
    type: 'NucliaDB Self-hosted',
    items: [{ title: 'Searches, suggestions and questions', free: '5000 searches/month *', over: '0.0008€ /search' }],
  },
];

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
}
