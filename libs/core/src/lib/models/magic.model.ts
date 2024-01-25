import { AuthTokens } from './user.model';

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
}

export type MagicActionError = 'local_user_already_exists' | 'user_registered_as_external_user';
