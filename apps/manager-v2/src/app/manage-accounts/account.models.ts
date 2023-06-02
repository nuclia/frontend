import { Account, AccountBlockingState, AccountConfig, AccountLimitsPatchPayload, WelcomeUser } from '@nuclia/core';
import { Language, UserType } from '@flaps/core';

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
  stashes: AccountKbList;
}
export type AccountUserType = 'manager' | 'member';

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
  max_dedicated_processors?: number;
  data?: object;
  blocking_state?: AccountBlockingState;
  limits?: AccountLimitsPatchPayload;
}

export interface AccountKbList {
  max_stashes: number;
  items: KnowledgeBox[] | null;
}

export type KbStates = 'PUBLISHED' | 'PRIVATE';
export type KbRoles = 'SOWNER' | 'SMEMBER' | 'SCONTRIBUTOR';

export interface KbUser extends WelcomeUser {
  id: string;
}

export interface KbSummary {
  id: string;
  slug: string;
  title: string;
  members: KbUser[];
  contributors: KbUser[];
  owners: KbUser[];
  created: string;
  modified: string;
}

export interface KnowledgeBox {
  id: string;
  slug: string;
  title: string;
  description?: string;
  avatar?: string;
  state: KbStates;
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

export enum BlockedFeature {
  UPLOAD = 'upload',
  PROCESSING = 'processing',
  SEARCH = 'search',
  GENERATIVE = 'generative',
}

export interface BlockedFeaturesPayload {
  blocking_state: AccountBlockingState;
  blocked_features: BlockedFeature[];
}
