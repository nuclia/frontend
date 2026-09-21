/** True when `url`'s registrable domain matches the backend API's, so it's safe to redirect to. */
export function isCameFromLegit(url: string, backendOrigin: string): boolean {
  const backendMainDomain = backendOrigin.split('/')[2].split('.').slice(1).join('.');
  const urlMainDomain = url.split('/')[2].split('.').slice(1).join('.');
  return urlMainDomain === backendMainDomain;
}

// `login_challenge_expired_or_invalid` is intentionally excluded: its meaning (and message)
// depends on the caller (magic-link "account ready, please log in again" vs SSO "session expired").
const LOGIN_ERROR_MESSAGE_KEYS = {
  invite_not_found: 'login.error.invite_not_found',
  magic_token_expired: 'login.error.magic_token_expired',
  magic_token_already_used: 'login.error.magic_token_already_used',
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

type LoginErrorCode = keyof typeof LOGIN_ERROR_MESSAGE_KEYS;

// Variants for when the user has already been redirected back to a valid came_from: telling them
// to "go back to your app" would be confusing since they're already there.
const LOGIN_ERROR_MESSAGE_KEYS_AFTER_RESTART: Partial<Record<LoginErrorCode, string>> = {
  invite_not_found: 'login.error.invite_not_found_restarted',
  magic_token_expired: 'login.error.magic_token_expired_restarted',
  magic_token_already_used: 'login.error.magic_token_already_used_restarted',
  login_challenge_missing: 'login.error.login_challenge_missing_restarted',
  login_accept_failed: 'login.error.login_accept_failed_restarted',
};

/** Maps a backend `error_code` (or, for older deployments, the raw `detail` string) to an i18n key.
 * Pass `hasCameFrom: true` when the message will be shown after already redirecting the user back
 * to their app, so "go back to your app"-style copy is swapped for a variant that fits that context. */
export function getLoginErrorMessageKey(
  code: LoginErrorCode | undefined | null,
  fallback: string,
  hasCameFrom = false,
): string {
  if (!code) return fallback;

  if (hasCameFrom) {
    const restartedKey = LOGIN_ERROR_MESSAGE_KEYS_AFTER_RESTART[code];
    if (restartedKey) return restartedKey;
  }

  return LOGIN_ERROR_MESSAGE_KEYS[code] || fallback;
}
