import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Size } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsi-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SpinnerComponent {
  @Input()
  set size(value: Size | undefined) {
    if (value) {
      this._size = value;
    }
  }
  get size() {
    return this._size;
  }

  private _size: Size = 'medium';
}
