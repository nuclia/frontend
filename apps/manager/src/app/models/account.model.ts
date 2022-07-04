import { Language, UserType } from '@flaps/core';
import { Stash } from './stash.model';

export interface AccountPreferences {}
export interface UserPreferences {}
export type AccountUserType = 'manager' | 'member';

export interface Account {
  id: string;
  slug: string;
  creator: string;
  email: string;
  created: string;
  modified?: string;
  dealer?: string;
  title?: string;
  type?: string;
  avatar?: string;
  domain?: string;
  data: AccountPreferences;
  users: AccountUser[];
  members: string[];
  managers: string[];
  stashes: AccountStashes;
  zone: string;
  indexer_slow_replicas: number;
  blocking_state: AccountBlockingState;
  limits: AccountManagerLimits;
}

export enum AccountBlockingState {
  NONE = 0,
  QUOTA = 1,
  MANAGER = 2,
}

export interface ActiveCampaignStart {
  contact_list: number;
}

export interface AccountManagerLimits {
  upload: {
    upload_limit_max_media_file_size: number;
    upload_limit_max_non_media_file_size: number;
  };
  processing: {
    monthly_limit_chars_processed: number;
    monthly_limit_media_seconds_processed: number;
    monthly_limit_non_media_files_processed: number;
  };
}

export interface AccountSummary {
  id: string;
  data: AccountPreferences;
  slug: string;
  title: string;
  type: string;
}

export interface AccountCreation {
  slug: string;
  email: string;
  zone: string;
  title?: string;
}

export interface AccountCreated {
  id: string;
}

export interface AccountPatch {
  slug?: string;
  email?: string;
  creator?: string;
  type?: string;
  kbs?: number;
  indexer_slow_replicas?: number;
  data?: object;
  blocking_state?: AccountBlockingState;
  limits?: AccountManagerLimits;
}

export interface AccountUserCreation {
  id: string;
}

export interface AccountUserPatch {
  type: string;
}

export interface AccountUser {
  id?: string;
  last_login?: string;
  last_login_ip?: string;
  avatar?: string;
  email: string;
  name?: string;
  type: UserType;
  language?: Language;
  created?: string;
  modified?: string;
  data?: UserPreferences;
}

export interface AccountStashes {
  max_stashes: number | null;
  items: Stash[] | null;
}
