import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { getLabelColor, LABEL_COLORS, LabelColor } from './label.utils';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'nsi-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelComponent {
  @Input() set color(value: string) {
    const labelColor = getLabelColor(value);
    if (labelColor) {
      this._color = labelColor;
    }
  }
  @Input()
  set selected(value: any) {
    this._selected = coerceBooleanProperty(value);
  }
  get selected() {
    return this._selected;
  }

  @Output() selectLabel: EventEmitter<void> = new EventEmitter<void>();

  get backgroundColor() {
    return this._color.mainColor;
  }
  get borderColor() {
    return this._color.textColor;
  }
  get textColor() {
    return this._color.textColor;
  }
  private _color: LabelColor = LABEL_COLORS[0];

  private _selected = false;
}
