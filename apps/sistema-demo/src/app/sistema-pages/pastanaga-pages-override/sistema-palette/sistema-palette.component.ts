import { Component, ChangeDetectionStrategy } from '@angular/core';

import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';

@Component({
  imports: [PaDemoModule],
  templateUrl: './sistema-palette.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: [
    '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/palette-page/palette-page.component.scss',
    'sistema-palette.component.scss',
  ],
})
export class SistemaPalettePageComponent {}
