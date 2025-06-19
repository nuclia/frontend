import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';
import { RouterLink } from '@angular/router';
import { ActionCardComponent } from '@nuclia/sistema';

@Component({
  imports: [PaDemoModule, RouterLink, ActionCardComponent],
  templateUrl: './sistema-action-card.component.html',
  styleUrl: './sistema-action-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaActionCardComponent {
  code = `<nsi-action-card
    navigateTo="/action-card"
    tagLine="tag line"
    title="Disabled example with tag line"
    description="A description which can be on several lines, there is enough space for it"
    textLink="Text link"></nsi-action-card>`;
}
