export enum Permission {
  Allow = 'Allow',
  Deny = 'Deny',
  AllowSingle = 'AllowSingle',
}

export class PermissionSet {
  [permission_id: string]: Permission;
}

export class LocalPermissions {
  roleperm: { [id: string]: PermissionSet } = {};
  prinperm: { [id: string]: PermissionSet } = {};
  prinrole: { [id: string]: PermissionSet } = {};
}

const READER_ROLES = [
  'guillotina.Owner',
  'guillotina.Reader',
  'guillotina.Editor',
  'guillotina.Reviewer',
  'guillotina.Manager',
  'guillotina.Member',
  'stashify.StashifyManager',
];

const EDIT_ROLES = ['guillotina.Owner', 'guillotina.Editor', 'guillotina.Manager', 'stashify.AccountManager'];

const OWNER_ROLES = ['guillotina.Owner', 'guillotina.Manager', 'stashify.AccountManager'];

const READER_PERM = 'guilloina.ViewContent';
const EDIT_PERM = 'guillotina.ModifyContent';
const CHPERM_PERM = 'guillotina.ChangePermissions';
const DELETE_PERM = 'guillotina.DeleteContent';
const ADD_PERM = 'guillotina.AddContent';

export interface UserRole {
  principal: string;
  role: string;
}

export class UsersList {
  users: UserRole[] = [];

  constructor(users: any) {
    this.users = users;
  }
}

export class Permissions {
  permissions: string[];

  get contrib(): boolean {
    return this.permissions.indexOf('CONTRIB') > -1;
  }
  get admin(): boolean {
    return this.permissions.indexOf('ADMIN') > -1;
  }
  get sidebar(): boolean {
    return this.contrib || this.admin;
  }

  constructor(permissions: any) {
    this.permissions = permissions;
  }
}