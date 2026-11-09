import { KbDetails } from '../../account-ui.models';
import { KbUserRow } from './kb-details.model';

export function getUserRows(kb: KbDetails): KbUserRow[] {
  return [
    ...kb.owners.map((user) => ({ user, role: 'owner' as const })),
    ...kb.contributors.map((user) => ({ user, role: 'contributor' as const })),
    ...kb.members.map((user) => ({ user, role: 'member' as const })),
  ];
}

export function getCopyText(kb: KbDetails, fullInfo: boolean): string {
  return fullInfo ? `Account: ${kb.accountId}\nZone: ${kb.zone.slug}\nKB: ${kb.id}` : kb.id;
}
