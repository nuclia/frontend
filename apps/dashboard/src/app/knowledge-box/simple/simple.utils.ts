import { Account } from '@nuclia/core';
import { differenceInDays } from 'date-fns';

export interface CoworkTrialState {
  isCoworkTrial: boolean;
  isTrialExpired: boolean;
  isAtEquator: boolean;
  daysLeft: number;
}

export function getCoworkTrialState(account: Account): CoworkTrialState {
  if (account.workflow !== 'cowork' || !account.trial_expiration_date) {
    return { isCoworkTrial: false, isTrialExpired: false, isAtEquator: false, daysLeft: 0 };
  }
  const expiration = new Date(`${account.trial_expiration_date}+00:00`);
  const now = new Date();
  const daysLeft = differenceInDays(expiration, now) + 1;
  const isTrialExpired = expiration < now;
  const isAtEquator = !isTrialExpired && daysLeft <= 7;
  return { isCoworkTrial: true, isTrialExpired, isAtEquator, daysLeft };
}
