import { Account } from '@nuclia/core';

export function isTrialExpired(account: Account): boolean {
  if (account.workflow !== 'cowork' || !account.trial_expiration_date) {
    return false;
  }
  const expiration = new Date(`${account.trial_expiration_date}+00:00`);
  const now = new Date();
  const isTrialExpired = expiration < now;
  return isTrialExpired;
}
