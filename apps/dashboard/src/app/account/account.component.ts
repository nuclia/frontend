import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SmallNavbarDirective } from '@flaps/common';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountComponent extends SmallNavbarDirective {}
