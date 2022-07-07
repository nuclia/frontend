import { KBRoles } from '@nuclia/core';

export type AccountRoles = 'AOWNER' | 'AMEMBER';

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: AccountRoles;
}

export interface SetUserAccount {
  id: string;
  role: AccountRoles;
}

export interface SetUsersAccount {
  add?: SetUserAccount[];
  delete?: string[];
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
  update?: SetUserKb[];
  delete?: string[];
}

export interface InviteAccountData {
  email: string;
}

export interface InviteKbData {
  email: string;
  role: KBRoles;
}
