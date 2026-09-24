import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { RouterModule } from '@angular/router';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent, MimeIconPipe } from '@nuclia/sistema';
import { isMemoryResource } from '../../memory/memory.helpers';
import { ResourceWithLabels } from '../resource-list.model';

@Component({
  selector: 'stf-title-cell',
  imports: [RouterModule, PaIconModule, MimeIconPipe, TranslateModule, BadgeComponent],
  templateUrl: './title-cell.component.html',
  styleUrl: './title-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitleCellComponent {
  @Input() row?: ResourceWithLabels;

  // Pure function reference, callable directly from the template.
  protected isMemoryResource = isMemoryResource;

  onClickLink($event: MouseEvent) {
    $event.stopPropagation();
  }
}
