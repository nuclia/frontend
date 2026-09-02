import { LoginErrorCode } from '@nuclia/core';

// `login_challenge_expired_or_invalid` is intentionally excluded: its meaning (and message)
// depends on the caller (magic-link "account ready, please log in again" vs SSO "session expired").
const LOGIN_ERROR_MESSAGE_KEYS: Partial<Record<LoginErrorCode, string>> = {
  invite_not_found: 'login.error.invite_not_found',
  magic_token_expired: 'login.error.magic_token_expired',
  local_user_already_exists: 'login.local_user_already_exists',
  user_registered_as_external_user: 'login.user_registered_as_external_user',
  login_challenge_missing: 'login.error.login_challenge_missing',
  login_accept_failed: 'login.error.login_accept_failed',
  user_not_registered: 'login.error.user_not_registered',
  oauth_token_exchange_failed: 'login.error.oauth_token_exchange_failed',
  oauth_missing_email: 'login.error.oauth_missing_email',
  oauth_missing_identity: 'login.error.oauth_missing_identity',
  tenant_not_authorized: 'login.error.tenant_not_authorized',
  domain_not_allowed: 'login.error.domain_not_allowed',
};

/** Maps a backend `error_code` (or, for older deployments, the raw `detail` string) to an i18n key. */
export function getLoginErrorMessageKey(code: string | undefined | null, fallback: string): string {
  return (code && LOGIN_ERROR_MESSAGE_KEYS[code as LoginErrorCode]) || fallback;
}
