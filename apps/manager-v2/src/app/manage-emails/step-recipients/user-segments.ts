import { AccountSubscriptionSummary } from '../../manage-accounts/global-account.models';
import {
  CustomerSubscriptionType,
  UserFilters,
  UserSubscriptionType,
  UserSummary,
} from '../../manage-users/user.models';

export type UserSegment = 'par_clients' | 'context_box' | 'progress' | 'trials' | 'leads';

export interface UserSegmentDefinition {
  id: UserSegment;
  label: string;
  description: string;
  filters: UserFilters;
  subscriptionTypes?: UserSubscriptionType[];
}

export const USER_SEGMENTS: UserSegmentDefinition[] = [
  {
    id: 'par_clients',
    label: 'PAR clients',
    description: 'Accounts with a Stripe, AWS or manual subscription that are not on the ContextBox (cowork) tier.',
    filters: { excludedAccountTypes: ['cowork'] },
    subscriptionTypes: ['stripe', 'aws_marketplace', 'manual'],
  },
  {
    id: 'context_box',
    label: 'ContextBox',
    description: 'Accounts on the ContextBox (cowork) tier, including trials and subscribed accounts.',
    filters: { accountTypes: ['cowork'] },
  },
  {
    id: 'progress',
    label: 'Progress',
    description: 'Accounts with a Cloud Zero subscription.',
    filters: {},
    subscriptionTypes: ['cloud_zero'],
  },
  {
    id: 'trials',
    label: 'Trials',
    description: 'All trial accounts.',
    filters: { accountTypes: ['stash-trial'] },
  },
  {
    id: 'leads',
    label: 'Leads',
    description:
      'Accounts that are neither trial nor ContextBox and have no active subscription (Stripe, AWS, Cloud Zero or manual).',
    filters: { excludedAccountTypes: ['stash-trial', 'cowork'] },
    subscriptionTypes: ['none'],
  },
];

export function mergeUsers(lists: UserSummary[][]): UserSummary[] {
  const users = new Map<string, UserSummary>();
  lists.flat().forEach((user) => {
    if (!users.has(user.id)) {
      users.set(user.id, user);
    }
  });
  return Array.from(users.values());
}

export function toSubscriptionsByAccount(
  subscriptions: AccountSubscriptionSummary[],
): ReadonlyMap<string, CustomerSubscriptionType> {
  return new Map(subscriptions.map((subscription) => [subscription.account_id, subscription.type]));
}

// The accounts of a user are the links already matching the other filters; accounts missing from the list have no subscription
export function filterBySubscription(
  users: UserSummary[],
  wanted: UserSubscriptionType[],
  subscriptions: ReadonlyMap<string, CustomerSubscriptionType>,
): UserSummary[] {
  return users.filter((user) =>
    (user.accounts || []).some((account) => wanted.includes(subscriptions.get(account.id) ?? 'none')),
  );
}
