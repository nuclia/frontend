import { Component, OnInit, Input } from '@angular/core';
import { WelcomeUser } from '@nuclia/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'stf-user-avatar-simple',
  templateUrl: './user-avatar-simple.component.html',
  styleUrls: ['./user-avatar-simple.component.scss'],
})
export class UserAvatarSimpleComponent implements OnInit {
  @Input() userPrefs: WelcomeUser | undefined;
  @Input() size: 'normal' | 'small' = 'normal';
  @Input()
  get blackMode(): boolean {
    return this._blackMode;
  }
  set blackMode(value: boolean) {
    this._blackMode = coerceBooleanProperty(value);
  }
  private _blackMode = false;
  avatar?: string = undefined; // TODO

  constructor() {}

  ngOnInit(): void {}

  getInitials(): string {
    return this.constructInitials(this.userPrefs?.name?.split(' ')).substring(0, 2);
  }

  private constructInitials(elements: string[] | undefined): string {
    if (!elements || !elements.length) {
      return '';
    }

    return elements
      .filter((element) => element && element.length > 0)
      .map((element) => element[0].toUpperCase())
      .join('');
  }
}
