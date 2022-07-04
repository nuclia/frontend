import { AuthTokens } from './user.model';

export interface TempToken {
  token: string;
}

export type MagicActionType =
  | 'create'
  | 'edit'
  | 'gostash'
  | 'login'
  | 'gosetpassword'
  | 'goaccount'
  | 'goselectaccount'
  | 'gosetupaccount';

export interface MagicAction {
  action: MagicActionType;
  token?: AuthTokens;
  account?: string; // Only 'goaccount' action
  stash?: string; // Only 'gostash' action
  path?: string; // Only 'create' and 'edit' actions
  id?: string; // Only 'create' and 'edit' actions
  then?: string; // Only 'login' action
}

export type MagicActionError = 'local_user_already_exists' | 'user_registered_as_external_user';
