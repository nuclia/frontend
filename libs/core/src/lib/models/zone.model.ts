export interface Zone {
  id: string;
  slug: string;
  title?: string;
  notAvailableYet?: boolean;
  cloud_provider: 'AWS' | 'GCP';
  subdomain: string;
}
