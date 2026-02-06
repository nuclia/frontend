import { UserType } from '../db';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  id_token?: string;
}

export type NucliaDBRole = 'READER' | 'WRITER' | 'MANAGER';

export interface AuthInfo {
  auth: string;
  ip_info?: IPAddressInfo;
}

export interface IPAddressInfo {
  client?: string;
  available?: { [key: string]: string };
}
