import { KBRoles } from '@nuclia/core';

export const SORTED_KB_ROLES: KBRoles[] = ['SMEMBER', 'SCONTRIBUTOR', 'SOWNER'];

export const KB_ROLE_TITLES: { [role in KBRoles]: string } = {
  SOWNER: 'api-key-management.key-roles.manager',
  SCONTRIBUTOR: 'api-key-management.key-roles.writer',
  SMEMBER: 'api-key-management.key-roles.reader',
};
