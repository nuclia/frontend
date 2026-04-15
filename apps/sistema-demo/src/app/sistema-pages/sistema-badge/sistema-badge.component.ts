import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';
import { BadgeComponent } from '@nuclia/sistema';

@Component({
  selector: 'nsd-sistema-badge',
  imports: [PaDemoModule, BadgeComponent],
  templateUrl: './sistema-badge.component.html',
  styleUrl: './sistema-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaBadgeComponent {
  code = `<nsi-badge>All resources</nsi-badge>

<nsi-badge count="120">Labels</nsi-badge>

<nsi-badge kind="tertiary">optional</nsi-badge>`;
}
