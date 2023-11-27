import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'nsy-connector',
  templateUrl: './connector.component.html',
  styleUrls: ['./connector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorComponent {
  @Input() title?: string;
  @Input() logo?: string;
  @Input() description?: string;
  @Input()
  set selected(value: any) {
    this._selected = coerceBooleanProperty(value);
  }
  get selected() {
    return this._selected;
  }
  private _selected = false;

  @Output() selectConnector: EventEmitter<MouseEvent | KeyboardEvent> = new EventEmitter<MouseEvent | KeyboardEvent>();
}
