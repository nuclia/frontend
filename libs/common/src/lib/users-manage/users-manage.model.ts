import { FullKbUser } from '@nuclia/core';

export type Order = 'role' | 'name';

export interface UserRow extends FullKbUser {
  expires?: string;
}

export type InviteEntryStatus = 'valid' | 'invalid' | 'duplicate' | 'existing' | 'failed';

export interface InviteEntry {
  id: string;
  email: string;
  status: InviteEntryStatus;
}

export interface InviteProgress {
  invited: number;
  failed: number;
  pending: number;
}
