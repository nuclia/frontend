import { AccountBlockingState, AccountLimits, AccountTypes, BlockedFeature, KBStates } from '@nuclia/core';
import { AccountUser } from './global-account.models';
import { ZoneSummary } from '../manage-zones/zone.models';

export type DedicatedProcessorsState = 'enabled' | 'disabled' | 'paused';

/**
 * Warning: this model is based on current global model from which we removed kb list.
 * But this model will probably change on the backend side soon.
 * (see how max_kbs is coming from stashes.max_stashes property)
 */
export interface Account {
  blocked_features: BlockedFeature[];
  blocking_state?: AccountBlockingState;
  created: string;
  creator: string;
  dedicated_processors_state: DedicatedProcessorsState;
  domain: string;
  email: string;
  g_speech_to_text: boolean;
  id: string;
  limits: AccountLimits;
  managers: string[];
  max_dedicated_processors: number;
  modified: string;
  slug: string;
  stashes: {
    max_stashes: number;
  };
  title: string;
  trial_expiration_date?: string;
  type: AccountTypes;
  users: AccountUser[];
}

export interface Kb {
  id: string;
  slug: string;
  zone: string;
  title: string;
  description: string;
  state: KBStates;
  created: string;
  admin: boolean;
  contrib: boolean;
}

export enum ModelType {
  GENERATIVE = 'GENERATIVE',
  NER = 'NER',
  RESOURCE_LABELER = 'RESOURCE_LABELER',
  CLASSIFIER = 'CLASSIFIER',
  ANONYMIZER = 'ANONYMIZER',
  VISUAL_LABELER = 'VISUAL_LABELER',
  SUMMARY = 'SUMMARY',
  DUMMY = 'DUMMY',
  PARAGRAPH_LABELER = 'PARAGRAPH_LABELER',
  EMBEDDINGS = 'EMBEDDINGS',
  RELATIONS = 'RELATIONS',
}

interface BaseAccountModel {
  model_id: string | null;
  account: string | null;
  model_type: ModelType | null;
  trained_date: string | null;
  location: string | null;
  trained_kbid: string | null;
}

export interface AccountModelSummary extends BaseAccountModel {
  title: string | null;
}

export interface AccountModel extends BaseAccountModel {
  log: string | null;
  kbids: string[];
}

export interface AccountModelPayload {
  model_type: ModelType;
  location: string;
  description?: string;
}

export interface ZoneModels {
  zone: ZoneSummary;
  models: AccountModelSummary[];
}
