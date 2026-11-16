export interface Zone {
  id: string;
  slug: string;
  title?: string;
  cloud_provider: 'AWS' | 'GCP';
  private: boolean;
  origin: string | null;
  components: Component[];
}

export interface Component {
  name: 'rag' | 'studio';
  available: boolean;
  determined_by:
    | 'manifest_default'
    | 'zone_override'
    | 'account_override'
    | 'component_not_declared_in_zone'
    | 'zone_missing_from_manifest';
}
