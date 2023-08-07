export interface ZoneSummary {
  id: string;
  slug: string;
  account: string | null;
  title: string;
  created: string;
  modified: string | null;
  '@id': string;
}

export interface Zone {
  id: string;
  slug: string;
  title: string;
  creator: string;
  created: string;
  modified: string;
}

export interface ZoneAddPayload {
  slug: string;
  title: string;
  creator: string;
}

export interface ZonePatchPayload {
  slug?: string;
  title?: string;
}
