import { CommonModule } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PaChipsModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-chip',
  imports: [CommonModule, PaChipsModule],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  fill = input(false, { transform: booleanAttribute });
}
