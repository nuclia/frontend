import { AccountBlockingState, AccountLimits, AccountTypes, BlockedFeature, KBRoles } from '@nuclia/core';
import { DedicatedProcessorsState } from './regional-account.models';

export interface AccountSummary {
  id: string;
  slug: string;
  title: string;
  type: AccountTypes;
}

export interface AccountDetails extends AccountSummary {
  blockingState?: AccountBlockingState;
  dedicatedProcessorsState: DedicatedProcessorsState;
  email: string;
  limits: AccountLimits;
  maxDedicatedProcessors: number;
  maxKbs: number;
  trialExpirationDate?: string;
  users: AccountUser[];
}

export interface KbSummary {
  id: string;
  slug: string;
  title: string;
  accountId: string;
  zoneId: string;
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

export interface KbUser {
  id: string;
  name: string;
  email: string;
  role: KBRoles;
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
