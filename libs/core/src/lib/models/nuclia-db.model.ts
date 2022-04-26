

export interface NucliaDB {
  token: string;
  nucliadb_id: string;
}

export interface NucliaDBKeyCreation {
  contact: string;
  title: string
  description?: string;
}

export interface NucliaDBMeta {
  title: string;
  description: string;
  contact: string;
  created: string;
  partitions: number;
  zone: string;
}
