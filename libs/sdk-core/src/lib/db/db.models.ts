export type AccountTypes =
  | 'stash-basic'
  | 'stash-team'
  | 'stash-enterprise'
  | 'stash-pro'
  | 'stash-growth'
  | 'stash-business';

export const NUA_KEY = 'NUCLIA_NUA_KEY';
export const NUA_CLIENT = 'NUCLIA_NUA_CLIENT';

export interface Account {
  id: string;
  slug: string;
  title: string;
  description?: string;
  zone: string;
  type: AccountTypes;
  can_manage_account: boolean;
  current_kbs: number;
  max_kbs: number;
  current_users: number;
  max_users: number | null;
  config?: AccountConfig;
  limits: AccountLimits;
}

export interface AccountConfig {
  g_speech_to_text: boolean;
}

export interface AccountLimits {
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
  YEAR = 'year',
}

export enum StatsRange {
  anHour = '1h',
  twoHours = '2h',
  threeHours = '3h',
  sixHours = '6h',
  twelveHours = '12h',
  twentyFourHours = '24h',
  fortyHeightHours = '48h',
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
  RESOURCES = 'resources',
  PAGES = 'pages',
  TRAIN_SECONDS = 'train_seconds',
  SUGGESTIONS = 'suggestions',
  DOCS_NO_MEDIA = 'docs_no_media',
}

export interface Welcome {
  preferences: WelcomeUser;
  accounts: string[];
  create: boolean;
  dependant_accounts: { id: string; slug: string }[];
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

export interface NUAClientPayload {
  client_id?: string;
  contact: string;
  description?: string;
  title: string;
  webhook?: string;
}

export interface NUAClient extends NUAClientPayload {
  client_id: string;
  created: string;
  partitions: 0;
  zone: string;
}

export interface ProcessingPushResponse {
  seqid: number;
  account_seq: number;
  uuid: string;
}

export interface ProcessingPullResponse {
  status: string;
  payload?: string; // protobuf base64 encoded
  msgid?: string;
}

export interface ProcessingStatusResponse {
  shared: { last_delivered_seqid: number | null };
  account?: { last_delivered_seqid: number | null };
}

export interface LearningConfigurations {
  [key: string]: LearningConfiguration;
}

export interface LearningConfiguration {
  options: { value: string; name: string }[];
  default: string;
}

export type LearningConfigurationSet = { id: string; data: LearningConfiguration }[];
