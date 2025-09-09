
import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PaChipsModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'stf-chip',
  imports: [PaChipsModule],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  fill = input(false, { transform: booleanAttribute });
}
