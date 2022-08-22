import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  templateUrl: './sistema-label.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaLabelComponent {
  code = `<pa-chip-selectionable textColor="#1D00C2FF" borderColor="#1D00C2FF" backgroundColor="#C7BDFFFF"
                       [selected]="selection === 1"
                       (select)="onSelect(1)">Blue label
</pa-chip-selectionable>

<pa-chip-selectionable [selected]="selection === 2"
                       (select)="onSelect(2)">Black label
</pa-chip-selectionable>

<pa-chip-selectionable textColor="#C7A900FF" borderColor="#C7A900FF" backgroundColor="#FFF8D1FF"
                       [selected]="selection === 3"
                       (select)="onSelect(3)">Yellow label
</pa-chip-selectionable>

<pa-chip-selectionable textColor="#0CAD55" borderColor="#0CAD55" backgroundColor="#DAF3E6"
                       [selected]="selection === 4"
                       (select)="onSelect(4)">Green label
</pa-chip-selectionable>`;

  selection?: number;

  onSelect(id: number) {
    if (this.selection !== id) {
      this.selection = id;
    } else {
      this.selection = undefined;
    }
  }
}
