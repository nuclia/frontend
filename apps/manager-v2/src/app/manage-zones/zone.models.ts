export interface ZoneSummary {
  id: string;
  slug: string;
  account: string | null;
  title: string;
  created: string;
  modified: string | null;
  '@id': string;
  cloud_provider: 'AWS' | 'GCP';
  subdomain: string;
}

export interface Zone {
  id: string;
  slug: string;
  title: string;
  creator: string;
  created: string;
  modified: string;
  cloud_provider: 'AWS' | 'GCP';
  subdomain: string;
}

export interface ZoneAddPayload {
  slug: string;
  title: string;
  creator: string;
  cloud_provider: 'AWS' | 'GCP';
  subdomain: string;
}

export interface ZonePatchPayload {
  slug?: string;
  title?: string;
  cloud_provider?: 'AWS' | 'GCP';
  subdomain?: string;
}
