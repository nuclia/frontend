import {
  AccountBlockingState,
  AccountLimits,
  AccountTypes,
  BlockedFeature,
  CustomModelItem,
  KBStates,
  ModelType,
} from '@nuclia/core';
import { ZoneSummary } from '../manage-zones/zone.models';
import { AccountUser } from './global-account.models';

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
  arags?: {
    max_arags: number;
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

export interface AccountModelPayload {
  model_type: ModelType;
  location: string;
  description?: string;
}

export interface ZoneModels {
  zone: ZoneSummary;
  models: CustomModelItem[];
}
