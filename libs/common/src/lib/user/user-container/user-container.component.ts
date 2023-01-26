import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'stf-user-container',
  templateUrl: './user-container.component.html',
  styleUrls: ['./user-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserContainerComponent {
  @Input()
  set alignLeft(value: any) {
    this._alignLeft = coerceBooleanProperty(value);
  }
  get alignLeft() {
    return this._alignLeft;
  }
  private _alignLeft = false;

  @Input()
  set alignTopOnSmallScreens(value: any) {
    this._alignTopOnSmallScreens = coerceBooleanProperty(value);
  }
  get alignTopOnSmallScreens() {
    return this._alignTopOnSmallScreens;
  }
  private _alignTopOnSmallScreens = false;
}
