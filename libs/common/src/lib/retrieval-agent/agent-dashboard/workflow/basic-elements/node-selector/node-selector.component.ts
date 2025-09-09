
import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-node-selector',
  imports: [PaIconModule],
  templateUrl: './node-selector.component.html',
  styleUrl: './node-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeSelectorComponent {
  nodeTitle = input.required<string>();
  description = input.required<string>();
  icon = input<string>();

  select = output<void>();

  @HostListener('click') onClick() {
    this.select.emit();
  }
}
