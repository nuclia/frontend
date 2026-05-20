export const ZONE_VISIBILITY_OPTIONS = [
  { value: 'DEFAULT', label: 'DEFAULT — public zones + granted private zones' },
  { value: 'RESTRICTED', label: 'RESTRICTED — only explicitly granted zones' },
] as const;

export type ZoneVisibility = (typeof ZONE_VISIBILITY_OPTIONS)[number]['value'];

export interface ZoneAccountEntry {
  account_id: string;
  zone_id: string;
}

export interface ZoneSummary {
  id: string;
  slug: string;
  account: string | null;
  title: string;
  created: string;
  modified: string | null;
  '@id': string;
  cloud_provider: 'AWS' | 'GCP';
  private: boolean;
  origin: string | null;
}

export interface Zone {
  id: string;
  slug: string;
  title: string;
  creator: string;
  created: string;
  modified: string;
  cloud_provider: 'AWS' | 'GCP';
  private: boolean;
  origin: string | null;
}

export interface ZoneAddPayload {
  slug: string;
  title: string;
  creator: string;
  cloud_provider: 'AWS' | 'GCP';
  private?: boolean;
  origin?: string | null;
}

export interface ZonePatchPayload {
  slug?: string;
  title?: string;
  cloud_provider?: 'AWS' | 'GCP';
  private?: boolean;
  origin?: string | null;
}
