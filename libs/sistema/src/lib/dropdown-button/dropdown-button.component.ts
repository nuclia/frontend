import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DropdownComponent,
  Kind,
  PaButtonModule,
  PaIconModule,
  PaPopupModule,
  Size,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'nsi-dropdown-button',
  standalone: true,
  imports: [CommonModule, PaButtonModule, PaIconModule, PaPopupModule, TranslateModule],
  templateUrl: './dropdown-button.component.html',
  styleUrls: ['./dropdown-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownButtonComponent {
  @Input() popupRef?: DropdownComponent;
  @Input() size?: Size;
  @Input() kind?: Kind;

  @Input()
  set open(value: any) {
    this._open = coerceBooleanProperty(value);
  }
  get open() {
    return this._open;
  }
  private _open = false;
}
