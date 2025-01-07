import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DesktopUploadService } from '../..';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'stf-desktop-sources',
  templateUrl: './desktop-sources.component.html',
  styleUrls: ['./desktop-sources.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DesktopSourcesComponent {
  @Input()
  set showDetails(value: any) {
    this._showDetails = coerceBooleanProperty(value);
  }
  get showDetails() {
    return this._showDetails;
  }

  private _showDetails = false;
  protected readonly Desktop = DesktopUploadService;
}
