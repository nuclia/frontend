import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ICONS } from '../../../../assets/glyphs';
import { BaseIconPageComponent } from '@guillotinaweb/pastanaga-angular/demo';

@Component({
  templateUrl:
    '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/icon-page/icon-page.component.html',
  styleUrls: [
    '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/icon-page/icon-page.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SistemaIconsComponent extends BaseIconPageComponent implements OnInit {
  ngOnInit(): void {
    this.icons = ICONS.sort();
  }
}
