import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map } from 'rxjs';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-knowledge-box-users',
  template: `
    <div class="knowledge-box-users">
      <h2 class="display-s">{{ 'stash.side.users' | translate }}</h2>
      <app-users-manage></app-users-manage>
    </div>
  `,
  styleUrls: ['./knowledge-box-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxUsersComponent {
  kbSlug = this.sdk.currentKb.pipe(map((kb) => kb.slug || ''));
  constructor(private sdk: SDKService) {}
}
