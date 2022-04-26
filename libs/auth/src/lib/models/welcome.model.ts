import { UserType, Language } from './user.model';

export interface User {
  id: string;
  name: string;
  email: string;
  language?: Language;
  type: UserType;
  last_login?: string;
  avatar?: string;
}

export interface IUserPreferences {
  last_login?: string;
  email: string;
  name?: string;
  type: UserType;
  language?: Language;
  // is missing the avatar field ??
}

export class UserPreferences {
  last_login?: string;
  email: string;
  name?: string;
  type: UserType;
  language?: Language;
  avatar?: string;

  constructor(pref: IUserPreferences, user: User) {
    this.last_login = pref.last_login;
    this.email = pref.email;
    this.name = pref.name;
    this.type = pref.type;
    this.language = pref.language;
    this.avatar = user.avatar;
  }
}

export interface SetUserPreferences {
  name?: string;
  avatar?: string;
  email?: string;
  language?: string;
}

export interface Welcome {
  preferences: UserPreferences;
  accounts: string[];
  create: boolean;
}
