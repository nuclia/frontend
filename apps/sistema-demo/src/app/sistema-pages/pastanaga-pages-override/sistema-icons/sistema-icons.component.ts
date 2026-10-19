import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaDropdownModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { BaseIconPageComponent, PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';
import { ICONS } from '../../../../assets/glyphs';

@Component({
  templateUrl:
    '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/icon-page/icon-page.component.html',
  styleUrls: [
    '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/icon-page/icon-page.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaDemoModule, PaIconModule, PaTextFieldModule, FormsModule, PaDropdownModule],
})
export class SistemaIconsComponent extends BaseIconPageComponent implements OnInit {
  ngOnInit(): void {
    this.icons = ICONS.toSorted((a, b) => a.localeCompare(b));
  }
}
