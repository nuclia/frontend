import { Language, UserType } from '@flaps/core';

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
