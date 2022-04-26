export type AccountTypes = 'stash-basic' | 'stash-team' | 'stash-enterprise';

export interface Account {
  id: string;
  slug: string;
  title: string;
  zone: string;
  type: AccountTypes;
  can_manage_account: boolean;
  current_kbs: number;
  max_kbs: number;
  current_users: number;
  max_users: number | null;
}

export interface AccountCreation {
  slug: string;
  title: string;
  description?: string;
  email?: string;
  zone?: string;
}

export interface AccountStatus {
  available: boolean;
}

export enum StatsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year,',
}

export interface ProcessingStat {
  time_period: string;
  stats: number;
}

export enum StatsType {
  PROCESSING_TIME = 'processing_time',
  SEARCHES = 'searches',
  CHARS = 'chars',
  MEDIA_SECONDS = 'media_seconds',
  BYTES = 'bytes',
  FILES = 'files',
}

export interface Welcome {
  preferences: WelcomeUser;
  accounts: string[];
  create: boolean;
}

export interface WelcomeUser {
  last_login?: string;
  email: string;
  name?: string;
  type: UserType;
  language?: Language;
}

export type UserType = 'ROOT' | 'DEALER' | 'USER';
export type Language = 'CA' | 'ES' | 'EN';
