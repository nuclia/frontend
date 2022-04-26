export type AccountTypes = 'stash-basic' | 'stash-team' | 'stash-enterprise';

export interface Account {
  id: string;
  slug: string;
  zone: string;
  title: string;
  type: AccountTypes;
  description?: string;
  can_manage_account: boolean;
  current_kbs: number;
  max_kbs: number;
  current_users: number;
  max_users: number | null;
  config?: {
    g_speech_to_text?: boolean;
    indexer_slow_replicas?: number;
  };
}

export interface SimpleAccount {
  id: string;
  slug: string;
  zone: string;
  title: string;
  type: AccountTypes;
}

export interface AccountCreation {
  slug: string;
  title: string;
  description?: string;
  email?: string;
  zone?: string;
}

export interface AccountModification {
  title?: string;
  description?: string;
  g_speech_to_text?: boolean;
  indexer_slow_replicas?: boolean;
}

export interface AccountStatus {
  available: boolean;
}
