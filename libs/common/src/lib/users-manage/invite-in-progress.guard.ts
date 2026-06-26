import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KnowledgeBoxUsersComponent } from '../knowledge-box-users/knowledge-box-users.component';

export const inviteInProgressGuard = (component: KnowledgeBoxUsersComponent) => {
  const translate = inject(TranslateService);

  if (!component.users.inviteInProgress()) {
    return true;
  }

  return window.confirm(translate.instant('stash.users.leave_during_invite_confirm'));
};
