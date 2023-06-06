import { AccountTypes } from '@nuclia/core';

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

export interface AccountTypeDefaults {
  max_kbs: number;
  max_dedicated_processors: number;
  max_trial_days: number;
  monthly_limit_paragraphs_processed: number;
  monthly_limit_docs_no_media_processed: number;
  monthly_limit_media_seconds_processed: number;
  monthly_limit_paragraphs_stored: number;
  monthly_limit_hosted_searches_performed: number;
  monthly_limit_hosted_answers_generated: number;
  monthly_limit_self_hosted_searches_performed: number;
  monthly_limit_self_hosted_answers_generated: number;
  upload_limit_max_media_file_size: number;
  upload_limit_max_non_media_file_size: number;
}
