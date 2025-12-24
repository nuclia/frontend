import { AccountDetails } from './account-ui.models';

export const ACCOUNT_DETAILS: AccountDetails = {
  id: '187be161-3e95-4ed9-9244-f3c6eae17232',
  slug: 'catwoman',
  title: "catwoman's account",
  type: 'v3enterprise',
  email: 'catwoman+new@nuclia.com',
  created: '2023-11-27T13:22:34.267865Z',
  maxAgents: 5,
  maxMemories: 2,
  maxKbs: 5,
  users: [
    {
      id: '34f005d3-3cc1-41e4-8392-0dfd70e122df',
      email: 'catwoman+new@nuclia.com',
      name: 'catwoman',
    },
  ],
  limits: {
    upload: { upload_limit_max_media_file_size: -1, upload_limit_max_non_media_file_size: 3221225472 },
    usage: {
      monthly_limit_paragraphs_processed: -1,
      monthly_limit_docs_no_media_processed: -1,
      monthly_limit_media_seconds_processed: -1,
      monthly_limit_paragraphs_stored: -1,
      monthly_limit_hosted_searches_performed: -1,
      monthly_limit_hosted_answers_generated: -1,
      monthly_limit_self_hosted_searches_performed: -1,
      monthly_limit_self_hosted_answers_generated: -1,
      storage_limit_max_bytes_per_kb: -1,
      storage_limit_max_resources_per_kb: -1,
    },
  },
};
