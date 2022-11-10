export interface Zone {
  id: string;
  slug: string;
  title: string;
  creator: string;
  account: string;
  created: string;
  modified: string;
  external: boolean;
}

export interface ZoneSummary {
  id: string;
  slug: string;
  account: string | null;
  title: string;
  created: string;
  modified: string | null;
  '@id': string;
}

export interface ZoneAdd {
  slug: string;
  title: string;
  creator: string;
}

export interface ZonePatch {
  slug?: string;
  title?: string;
  url?: string;
  certificate?: string;
}
