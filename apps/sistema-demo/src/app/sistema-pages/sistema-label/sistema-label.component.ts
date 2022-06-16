import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  templateUrl: './sistema-label.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaLabelComponent {
  selection?: number;

  onSelect(id: number) {
    if (this.selection !== id) {
      this.selection = id;
    } else {
      this.selection = undefined;
    }
  }
}
