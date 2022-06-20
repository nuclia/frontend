export type StashStates = 'PUBLISHED' | 'PRIVATE';
export type StashRoles = 'SOWNER' | 'SMEMBER' | 'SCONTRIBUTOR';

export interface StashPreferences {}

export interface StashSummary {
  id: string;
  slug: string;
  title: string;
  members: string[];
  contributors: string[];
  owners: string[];
  created: string;
  modified: string;
}

export interface Stash {
  id: string;
  slug: string;
  title?: string;
  description?: string;
  avatar?: string;
  state: StashStates;
  account: string;
  creator: string;
  zone: string;
  created: string;
  modified: string;
  data: StashPreferences;
}

export interface ManagerStash {
  id: string;
  slug: string;
  title: string;
  members: string[];
  contributors: string[];
  owners: string[];
  created: string;
  modified: string;
}

export interface KnowledgeBoxCreation {
  id: string;
  zone?: string;
  title?: string;
}

export interface StashCreated {
  id: string;
}

export interface StashPatch {
  slug?: string;
  title?: string;
}

export interface StashAddUser {
  user: string;
  stash: string;
}

export interface StashPatchUser {
  type: StashRoles;
}
