import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsi-status',
  imports: [PaIconModule],
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SisStatusComponent {
  @Input() set status(value: string) {
    this._status = value.toLowerCase();
    switch (this._status) {
      case 'processed':
        this._statusIcon = 'circle-check';
        break;
      case 'error':
        this._statusIcon = 'warning';
        break;
      case 'pending':
      default:
        this._statusIcon = 'circle-dash';
        break;
    }
  }
  get status() {
    return this._status;
  }

  get statusIcon() {
    return this._statusIcon;
  }
  private _status = '';
  private _statusIcon = '';
}
