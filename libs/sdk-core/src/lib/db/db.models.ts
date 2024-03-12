export type AccountTypes =
  | 'stash-trial'
  | 'v3starter'
  | 'v3fly'
  | 'v3growth'
  | 'v3enterprise'

  // Deprecated
  | 'stash-basic'
  | 'stash-team'
  | 'stash-startup'
  | 'stash-starter'
  | 'stash-growth'
  | 'stash-enterprise'
  | 'stash-developer'
  | 'stash-business';

export const NUA_KEY = 'NUCLIA_NUA_KEY';

export interface Account {
  blocked_features: BlockedFeature[];
  blocking_state?: AccountBlockingState;
  can_manage_account: boolean;
  config?: AccountConfig;
  current_kbs?: number;
  current_users?: number;
  domain?: string;
  description?: string;
  id: string;
  limits?: AccountLimits;
  max_kbs: number;
  max_users: number | null;
  saml_entity_id?: string;
  saml_sso_url?: string;
  saml_x509_cert?: string;
  slug: string;
  title: string;
  trial_expiration_date?: string;
  type: AccountTypes;
  zone: string;
}

export interface AccountConfig {
  g_speech_to_text: boolean;
  indexer_slow_replicas: number; // Deprecated, use max_dedicated_processors instead
  max_dedicated_processors: number;
}

export type UploadLimitsEntries = 'upload_limit_max_media_file_size' | 'upload_limit_max_non_media_file_size';
export type UploadLimits = Record<UploadLimitsEntries, number>;
export type NullableUploadLimits = Record<UploadLimitsEntries, number | null>;

export type UsageLimitsEntries =
  | 'monthly_limit_docs_no_media_processed'
  | 'monthly_limit_hosted_answers_generated'
  | 'monthly_limit_hosted_searches_performed'
  | 'monthly_limit_media_seconds_processed'
  | 'monthly_limit_paragraphs_processed'
  | 'monthly_limit_paragraphs_stored'
  | 'monthly_limit_self_hosted_answers_generated'
  | 'monthly_limit_self_hosted_searches_performed';
export type UsageLimits = Record<UsageLimitsEntries, number>;
export type NullableUsageLimits = Record<UsageLimitsEntries, number | null>;

export interface AccountLimits {
  upload: UploadLimits;
  usage: UsageLimits;
}
export interface AccountLimitsPatchPayload {
  upload: NullableUploadLimits;
  usage: NullableUsageLimits;
}

export enum AccountBlockingState {
  UNBLOCKED = 'unblocked',
  QUOTA = 'quota',
  MANAGER = 'manager',
}
export enum BlockedFeature {
  UPLOAD = 'upload',
  PROCESSING = 'processing',
  SEARCH = 'search',
  GENERATIVE = 'generative',
  TRAINING = 'training',
  PUBLIC_UPLOAD = 'public_upload',
  PUBLIC_PROCESSING = 'public_processing',
  PUBLIC_SEARCH = 'public_search',
  PUBLIC_GENERATIVE = 'public_generative',
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
  saml?: {
    domain: string;
    entity_id: string;
    sso_url: string;
    x509_cert: string;
  };
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
  AI_TOKENS_USED = 'ai_tokens_used',
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
  allow_kb_management?: boolean;
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

export interface LearningConfigurations {
  [key: string]: LearningConfiguration;
}

export interface LearningConfigurationOption {
  value: string;
  name: string;
  user_key?: string;
  user_prompt?: string;
}

export interface LearningConfiguration {
  options?: LearningConfigurationOption[];
  schema?: LearningConfigurationSchema;
  schemas?: { [key: string]: LearningConfigurationSchema };
  default: string;
  create: boolean;
  update: boolean;
}

export function normalizeSchemaProperty(config: LearningConfigurations): LearningConfigurations {
  Object.values(config).forEach((item) => {
    if (item.schemas?.['title'] && item.schemas?.['type']) {
      item.schema = item.schemas as unknown as LearningConfigurationSchema;
      item.schemas = undefined;
    }
  });
  return config;
}

export const USER_PROMPTS = 'user_prompts';
export const SUMMARY_PROMPT = 'summary_prompt';

export interface LearningConfigurationSchema {
  title: string;
  type: string;
  properties: {
    [key: string]: {
      title: string;
      type: string;
      widget?: string;
      info?: string;
      examples?: string[];
    };
  };
  required: string[];
}

export type LearningConfigurationSet = { id: string; data: LearningConfiguration }[];

export interface LearningConfigurationUserKeys {
  [key: string]: {
    [key: string]: {
      title: string;
      required: boolean;
      textarea: boolean;
    };
  };
}

export interface PredictedToken {
  text: string;
  ner: string;
  start: number;
  end: number;
}

// ResourceProperties is not in resource.models to prevent circular dependencies between resource, search and chat
export enum ResourceProperties {
  BASIC = 'basic',
  ORIGIN = 'origin',
  RELATIONS = 'relations',
  VALUES = 'values',
  EXTRACTED = 'extracted',
  ERRORS = 'errors',
  EXTRA = 'extra',
  SECURITY = 'security',
}

export interface KbIndex {
  account_id: string;
  kb_id: string;
  zone_id: string;
}
