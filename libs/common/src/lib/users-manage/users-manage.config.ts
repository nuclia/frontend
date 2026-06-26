import { InviteEntryStatus } from './users-manage.model';

export const INVITE_STATUS_CLASS: Record<InviteEntryStatus, string> = {
  valid: 'chip-valid',
  failed: 'chip-error',
  invalid: 'chip-error',
  duplicate: 'chip-warning',
  existing: 'chip-warning',
};

export const INVITE_STATUS_I18N_KEY: Record<InviteEntryStatus, string> = {
  valid: 'stash.users.status_valid',
  invalid: 'stash.users.status_invalid',
  duplicate: 'stash.users.status_duplicate',
  existing: 'stash.users.status_existing',
  failed: 'stash.users.status_failed',
};

export const INVITE_REMOVE_ARIA_I18N_KEY: Record<InviteEntryStatus, string> = {
  valid: 'stash.users.remove_email',
  invalid: 'stash.users.remove_invalid_email',
  duplicate: 'stash.users.remove_duplicate_email',
  existing: 'stash.users.remove_email',
  failed: 'stash.users.remove_invalid_email',
};
