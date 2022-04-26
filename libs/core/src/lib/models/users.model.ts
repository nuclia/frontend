import { KBRoles } from '@nuclia/core';

export type AccountRoles = 'AOWNER' | 'AMEMBER';

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: AccountRoles;
}

export interface SetUserAccount {
  user: string;
  role: AccountRoles;
}

export interface SetUsersAccount {
  add: SetUserAccount[];
  delete: SetUserAccount[];
}

export interface KbUser {
  id: string;
  name: string;
  email: string;
  role: AccountRoles;
}

export interface SetUserKb {
  id: string;
  role: KBRoles;
}

export interface SetUsersKb {
  add?: SetUserKb[];
  delete: string[];
}

export interface InviteAccountData {
  email: string;
}

export interface InviteKbData {
  email: string;
  role: KBRoles;
}
