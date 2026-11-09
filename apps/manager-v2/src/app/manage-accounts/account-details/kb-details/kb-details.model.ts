import { KbUser } from '../../account-ui.models';

export interface KbUserRow {
  user: KbUser;
  role: 'owner' | 'contributor' | 'member';
}
