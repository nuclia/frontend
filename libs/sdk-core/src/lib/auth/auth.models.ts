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
  | 'redict_to_kb';

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
}

export type MagicActionError = 'local_user_already_exists' | 'user_registered_as_external_user';

export function replaceSubdomainInUrl(mainBackend: string, prefix?: string): string {
  if (!prefix) {
    return mainBackend;
  }
  if (mainBackend.includes('//accounts.')) {
    return mainBackend.replace('//accounts.', `//${prefix}.`);
  } else {
    return mainBackend.replace('//', `//${prefix}.`);
  }
}
