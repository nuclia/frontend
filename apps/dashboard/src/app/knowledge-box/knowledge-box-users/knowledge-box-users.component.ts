import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-knowledge-box-users',
  template: `
    <div class="knowledge-box-users">
      <h2>{{ 'account.stash.users' | translate }}</h2>
      <app-users-manage [kb]="(kbSlug | async) || undefined"></app-users-manage>
    </div>
  `,
  styles: [
    `
      .knowledge-box-users {
        padding: 70px var(--app-layout-margin-right);
      }
      h2 {
        margin: 0 0 36px 0;
        font-size: var(--stf-font-size-title);
        font-weight: var(--stf-font-weight-bold);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxUsersComponent {
  kbSlug = this.sdk.currentKb.pipe(map((kb) => kb.slug)) as Observable<string>;
  constructor(private sdk: SDKService) {}
}
