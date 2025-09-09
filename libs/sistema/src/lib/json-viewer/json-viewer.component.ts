import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaTableModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsi-json-viewer',
  imports: [CommonModule, PaTableModule],
  templateUrl: './json-viewer.component.html',
  styleUrls: ['./json-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewerComponent {
  @Input()
  set json(data: any) {
    this._json = data;
    this.isJsonArray = Array.isArray(this.json);
  }
  get json() {
    return this._json;
  }
  private _json: any;

  isJsonArray = false;

  isStructured(value: any) {
    return typeof value === 'object';
  }
}
