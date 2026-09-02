export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  id_token?: string;
}

export type NucliaDBRole = 'READER' | 'WRITER' | 'MANAGER';

export interface AuthInfo {
  auth: string;
  ip_info?: IPAddressInfo;
}

export interface IPAddressInfo {
  client?: string;
  available?: { [key: string]: string };
}

export type MagicActionType =
  | 'create'
  | 'edit'
  | 'login'
  | 'gosetpassword'
  | 'goaccount'
  | 'goselectaccount'
  | 'gosetupaccount'
  | 'startonboarding'
  | 'join_regional_kb'
  | 'redict_to_kb'
  | 'account_ready_please_login';

export interface MagicAction {
  action: MagicActionType;
  token?: AuthTokens;
  account?: string;
  path?: string; // Only 'create' and 'edit' actions
  id?: string; // Only 'create' and 'edit' actions
  then?: string; // Only 'login' action
  join_kb_token?: string;
  kb?: string;
  login_token?: AuthTokens;
  zone?: string;
  consent_url?: string;
  came_from?: string;
  needs_initial_setpassword?: boolean;
}

// Stable machine-readable codes returned by idp/idp_regional as `error_code` on login,
// magic-link/invite and SSO callback failures (see NucliaHTTPException on the backend).
export type LoginErrorCode =
  | 'invite_not_found'
  | 'magic_token_expired'
  | 'local_user_already_exists'
  | 'user_registered_as_external_user'
  | 'login_challenge_missing'
  | 'login_challenge_expired_or_invalid'
  | 'login_accept_failed'
  | 'user_not_registered'
  | 'oauth_token_exchange_failed'
  | 'oauth_missing_email'
  | 'oauth_missing_identity'
  | 'tenant_not_authorized'
  | 'domain_not_allowed';
