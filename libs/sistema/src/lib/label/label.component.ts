import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { getLabelColor, LABEL_COLORS, LabelColor } from './label.utils';

@Component({
  selector: 'nsi-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LabelComponent {
  @Input() set color(value: string) {
    const labelColor = getLabelColor(value);
    if (labelColor) {
      this._color = labelColor;
    }
  }
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) readonly = false;
  @Input({ transform: booleanAttribute }) set neutral(value: boolean) {
    if (value) {
      this._color = { ...LABEL_COLORS[3], textColor: '#000' };
    }
  }

  @Output() removeLabel: EventEmitter<{ event: MouseEvent | KeyboardEvent; value: any }> = new EventEmitter<{
    event: MouseEvent | KeyboardEvent;
    value: any;
  }>();

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
}
