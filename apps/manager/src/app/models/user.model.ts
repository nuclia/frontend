import { Language, UserType } from '@flaps/core';

export type LoginProvider = 'GOOGLE' | 'APPLE' | 'LOCAL' | 'SAML';

export interface User {
  id: string;
  name?: string;
  email: string;
  language?: Language;
  type: UserType;
  providers: LoginProvider[];
  data: { [key: string]: any };
  last_login: string | null;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  last_login: string | null;
  '@id': string;
}

export interface UserSearch {
  id: string;
  name: string;
  email: string;
}

export interface UserPatch {
  type?: UserType;
  email?: string;
  language?: Language;
  name?: string;
}

export interface AccountUserCreation {
  id: string;
}

export interface UserCreation {
  name: string;
  email: string;
  language?: Language;
  type?: UserType;
  last_login?: string;
}

export interface UserCreated {
  id: string;
}

// Sessions

export interface HeadersSessionData {
  host: string;
  accept: string;
  'user-agent': string;
  'remote-addr': string;
}

export interface SessionData {
  headers: HeadersSessionData;
}

export interface Session {
  data: SessionData;
  expiration: string;
}
