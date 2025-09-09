export interface Zone {
  id: string;
  slug: string;
  title?: string;
  cloud_provider: 'AWS' | 'GCP';
  subdomain: string;
}
