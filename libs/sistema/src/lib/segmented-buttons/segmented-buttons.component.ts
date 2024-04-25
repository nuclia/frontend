import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'nsi-segmented-buttons',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './segmented-buttons.component.html',
  styleUrl: './segmented-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedButtonsComponent {
  @Input({ required: true }) leftButton = '';
  @Input({ required: true }) rightButton = '';
  @Input() active: 'left' | 'right' = 'left';

  @Output() activeChange = new EventEmitter<'left' | 'right'>();

  toggleSelection(newSelection: 'left' | 'right') {
    this.active = newSelection;
    this.activeChange.emit(this.active);
  }
}
