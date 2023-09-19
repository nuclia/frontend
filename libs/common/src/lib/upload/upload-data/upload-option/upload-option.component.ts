import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'stf-upload-option',
  templateUrl: './upload-option.component.html',
  styleUrls: ['./upload-option.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadOptionComponent {
  @Input()
  set icon(value: string | undefined) {
    this._icon = value || '';
  }
  get icon(): string {
    return this._icon;
  }
  @Input()
  set text(value: string | undefined) {
    this._text = value || '';
  }
  get text(): string {
    return this._text;
  }

  private _icon = '';
  private _text = '';
}
