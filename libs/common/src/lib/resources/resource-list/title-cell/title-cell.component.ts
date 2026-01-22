import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { SisIconsModule } from '@nuclia/sistema';
import { RouterModule } from '@angular/router';
import { ResourceWithLabels } from '../resource-list.model';

@Component({
  selector: 'stf-title-cell',
  imports: [RouterModule, PaIconModule, SisIconsModule],
  templateUrl: './title-cell.component.html',
  styleUrl: './title-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitleCellComponent {
  @Input() row?: ResourceWithLabels;

  onClickLink($event: MouseEvent) {
    $event.stopPropagation();
  }
}
