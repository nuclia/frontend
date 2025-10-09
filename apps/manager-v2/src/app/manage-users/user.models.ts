import { Language } from '@flaps/core';
import { UserType } from '@nuclia/core';

export type LoginProvider = 'GOOGLE' | 'APPLE' | 'LOCAL' | 'SAML';

export interface User {
  id: string;
  name?: string;
  email: string;
  language?: Language;
  type: UserType;
  providers: LoginProvider[];
  data: { [key: string]: unknown };
  last_login: string | null;
}

export interface UserSearch {
  id: string;
  name: string;
  email: string;
}

export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  last_login: string | null;
  '@id': string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  language?: Language;
  last_login?: string | null;
  type: UserType;
}
