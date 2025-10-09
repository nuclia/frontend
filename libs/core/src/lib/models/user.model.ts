export type Language = 'CA' | 'ES' | 'EN';

export interface SignupData {
  name: string;
  email: string;
  company?: string;
}

export type SignupResponse = {
  action: 'check-mail' | 'user-exists';
};

export interface SetPasswordData {
  password: string;
}

export class RecoverData {
  username: string;
  app: string;
  constructor(username: string, app: string) {
    this.username = username;
    this.app = app;
  }
}

export class ResetData {
  password: string;
  token: string;
  constructor(password: string, token: string) {
    this.password = password;
    this.token = token;
  }
}

export interface LoginData {
  username: string;
  saml_data?: string;
  password?: string;
  provider?: string;
}

export interface OAuthLoginData {
  username: string;
  password: string;
  login_challenge: string;
}

export interface OAuthConsentData {
  user_id: string;
  user_email: string;
  user_name: string;
  client_id: string;
  client_name: string;
  requested_scope: string[];
  skip_consent: boolean;
}

export interface JwtUser {
  first_name: string;
  id: string;
  identifier: string;
  type: string;
  session: string;
  iat: number;
  exp: number;
}

export interface JwtUserV2 {
  client_id: string;
  exp: number;
  ext: {
    first_name: string;
    type: string;
  };
  iat: number;
  iss: string;
  jti: string;
  sub: string;
  nbf: number;
  scp: string[];
}

export class JwtUserAdapter implements JwtUser {
  user: JwtUserV2;

  constructor(user: JwtUserV2) {
    this.user = user;
  }

  get first_name() {
    return this.user.ext.first_name;
  }
  get type() {
    return this.user.ext.type;
  }
  get id() {
    return this.user.sub;
  }
  get iat() {
    return this.user.iat;
  }
  get exp() {
    return this.user.exp;
  }

  // Not implemented ?
  get identifier() {
    return '';
  }
  get session() {
    return '';
  }
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface RefreshResult {
  token: string;
}

// tslint:disable-next-line: no-empty-interface
export interface ResetResponse {}
