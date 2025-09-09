import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-knowledge-box-users',
  template: `
    <div class="knowledge-box-users page-spacing">
      <h2 class="display-s">{{ 'navbar.users' | translate }}</h2>
      @if (kb | async; as kb) {
        <app-users-manage [kb]="kb"></app-users-manage>
      } @else {
        @if (arag | async; as arag) {
          <app-users-manage [kb]="arag"></app-users-manage>
        }
      }
    </div>
  `,
  styleUrls: ['./knowledge-box-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KnowledgeBoxUsersComponent {
  kb = this.sdk.currentKb;
  arag = this.sdk.currentArag;

  constructor(private sdk: SDKService) {}
}
