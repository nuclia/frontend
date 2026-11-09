export type SubscriptionState = 'loading' | 'none' | 'cloud_zero' | 'manual' | 'other';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}
