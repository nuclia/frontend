import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent } from '@nuclia/sistema';

@Component({
  selector: 'app-node-selector',
  imports: [BadgeComponent, PaIconModule, TranslateModule],
  templateUrl: './node-selector.component.html',
  styleUrl: './node-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeSelectorComponent {
  nodeType = input.required<string>();
  nodeTitle = input.required<string>();
  description = input.required<string>();
  icon = input<string>();
  badge = input<string>();

  select = output<void>();

  @HostListener('click') onClick() {
    this.select.emit();
  }
}
