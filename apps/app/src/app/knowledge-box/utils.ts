import { KBRoles } from '@nuclia/core';

export const SORTED_KB_ROLES: KBRoles[] = ['SOWNER', 'SMEMBER', 'SCONTRIBUTOR'];

export const KB_ROLE_TITLES: { [role in KBRoles]: string } = {
  SOWNER: 'generic.owner',
  SCONTRIBUTOR: 'generic.contributor',
  SMEMBER: 'generic.member',
};
