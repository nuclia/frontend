import { Account, AccountBlockingState, AccountConfig, AccountLimits } from '@nuclia/core';
import { Language, UserType } from '@flaps/core';
import { BlockedFeature } from '../../../../manager/src/app/models/account.model';

export interface AccountSummary {
  id: string;
  data: unknown;
  slug: string;
  title: string;
  type: string;
}

export interface AccountUser {
  id: string;
  last_login?: string;
  last_login_ip?: string;
  avatar?: string;
  email: string;
  name: string;
  type: UserType;
  language?: Language;
  created: string;
  modified?: string;
  data?: unknown;
}

export interface ExtendedAccount extends Account, AccountConfig {
  creator: string;
  email: string;
  created: string;
  modified: string;
  managers: string[];
  members: string[];
  users: AccountUser[];
  stashes: AccountStashes;
}

export interface AccountCreationPayload {
  slug: string;
  email: string;
  zone: string;
  title?: string;
}

export interface AccountPatchPayload {
  slug?: string;
  email?: string;
  creator?: string;
  type?: string;
  kbs?: number;
  indexer_slow_replicas?: number;
  data?: object;
  blocking_state?: AccountBlockingState;
  limits?: AccountLimits;
}

export interface AccountStashes {
  max_stashes: number;
  items: Stash[] | null;
}

export type StashStates = 'PUBLISHED' | 'PRIVATE';
export type StashRoles = 'SOWNER' | 'SMEMBER' | 'SCONTRIBUTOR';

export interface StashSummary {
  id: string;
  slug: string;
  title: string;
  members: string[];
  contributors: string[];
  owners: string[];
  created: string;
  modified: string;
}

export interface Stash {
  id: string;
  slug: string;
  title: string;
  description?: string;
  avatar?: string;
  state: StashStates;
  account: string;
  creator: string;
  zone: string;
  created: string;
  modified: string;
  data: unknown;
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

export interface BlockedFeaturesPayload {
  blocking_state: AccountBlockingState;
  blocked_features: BlockedFeature[];
}
