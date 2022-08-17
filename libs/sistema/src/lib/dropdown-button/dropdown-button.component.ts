import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Aspect,
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
  @Input()
  set size(value: Size | undefined) {
    if (value) {
      this._size = value;
    }
  }
  get size(): Size {
    return this._size;
  }

  @Input()
  set kind(value: Kind | undefined) {
    if (value) {
      this._kind = value;
    }
  }
  get kind(): Kind {
    return this._kind;
  }

  @Input()
  set aspect(value: Aspect | undefined) {
    if (value) {
      this._aspect = value;
    }
  }
  get aspect(): Aspect {
    return this._aspect;
  }

  @Input()
  set open(value: any) {
    this._open = coerceBooleanProperty(value);
  }
  get open() {
    return this._open;
  }

  @Input()
  set disabled(value: any) {
    this._disabled = coerceBooleanProperty(value);
  }
  get disabled() {
    return this._disabled;
  }

  private _aspect: Aspect = 'solid';
  private _kind: Kind = 'secondary';
  private _size: Size = 'medium';
  private _open = false;
  private _disabled = false;
}
