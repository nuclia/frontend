import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageUsersComponent {}
