import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceWithLabels } from '@flaps/common';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { SisIconsModule } from '@nuclia/sistema';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'stf-title-cell',
  imports: [CommonModule, RouterModule, PaIconModule, SisIconsModule],
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
