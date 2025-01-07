import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { isColorInList } from '../../utils';
import { getLabelColor, isHexColor, isSameHexColor } from '@nuclia/sistema';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ColorPickerComponent {
  @Input() hexColors: string[] = [];

  @Input() set value(v: string) {
    this._value = v;
    this.selectedCustomColor = !!v && !this.isExistingColor(v);
  }
  get value(): string {
    return this._value;
  }
  private _value = '';

  @Output() valueChange = new EventEmitter<string>();

  selectedCustomColor: boolean = false;

  isExistingColor(color: string): boolean {
    return isHexColor(color) && isColorInList(color, this.hexColors);
  }

  getTextColor(color: string): string | undefined {
    return getLabelColor(color)?.textColor;
  }

  isSameHexColor(color1: string, color2: string) {
    return isSameHexColor(color1, color2);
  }

  setColor(color: string): void {
    if (color !== this.value) {
      this.valueChange.emit(color);
    }
  }
}
