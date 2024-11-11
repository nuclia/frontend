import { Account, BlockedFeature } from '@nuclia/core';

export const standaloneSimpleAccount: Account = {
  id: 'local',
  slug: 'local',
  title: 'NucliaDB local',
  zone: 'local',
  type: 'stash-basic',
  can_manage_account: false,
  blocked_features: [] as BlockedFeature[],
  max_kbs: -1,
  max_users: null,
  creation_date: '',
};

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
  storage_limit_max_bytes_per_kb: number,
  storage_limit_max_resources_per_kb: number,
  upload_limit_max_media_file_size: number;
  upload_limit_max_non_media_file_size: number;
}
