import { AccountBlockingState, AccountLimits, AccountTypes, BlockedFeature } from '@nuclia/core';
import { KbUser } from './global-account.models';

export interface AccountSummary {
  id: string;
  slug: string;
  title: string;
  type: AccountTypes;
}

export type DedicatedProcessorsState = 'enabled' | 'disabled' | 'paused';

export interface AccountDetails extends AccountSummary {
  blockingState?: AccountBlockingState;
  dedicatedProcessorsState: DedicatedProcessorsState;
  email: string;
  limits: AccountLimits;
  maxDedicatedProcessors: number;
  maxKbs: number;
  trialExpirationDate?: string;
  zone: string;
}

export interface KbSummary {
  id: string;
  slug: string;
  title: string;
}

export interface KbCounters {
  [kbId: string]: number;
}

export interface KbDetails extends KbSummary {
  created: string;
  contributors: KbUser[];
  members: KbUser[];
  owners: KbUser[];
}

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  isManager?: boolean;
}

export type BlockedFeatureFormValues = Record<BlockedFeature, boolean>;

export interface AccountConfigurationPayload {
  dedicatedProcessorsState: DedicatedProcessorsState;
  email: string;
  maxDedicatedProcessors: number;
  maxKbs: number;
  slug: string;
  trialExpirationDate?: string | null;
  type: AccountTypes;
}