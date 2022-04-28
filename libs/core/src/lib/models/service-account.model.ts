import { KBRoles } from '@nuclia/core';

export interface ServiceAccountKey {
  id: string;
  created: string;
  expires: string;
}

export interface ServiceAccount {
  id: string;
  title: string;
  role: KBRoles;
  keys?: ServiceAccountKey[];
}

export interface ServiceAccountCreation {
  title: string;
  role: KBRoles;
}

export interface ServiceAccountId {
  id: string;
}

export interface ServiceAccountKeyCreated {
  id: string;
  token: string;
}

export interface ServiceAccountKeyCreation {
  expires: string;
}
