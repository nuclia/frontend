import { Language, UserType } from '@nuclia/core';

export interface User {
  id: string;
  name: string;
  email: string;
  language?: Language;
  type: UserType;
  last_login?: string;
  avatar?: string;
}

export interface SetUserPreferences {
  name?: string;
  avatar?: string;
  email?: string;
  language?: Language;
}
