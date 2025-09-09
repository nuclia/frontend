import { Component } from '@angular/core';

import { PaDemoModule } from '../../../../../../../libs/pastanaga-angular/projects/demo/src';

@Component({
  imports: [PaDemoModule],
  templateUrl: './sistema-palette.component.html',
  styleUrls: [
    '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/palette-page/palette-page.component.scss',
    'sistema-palette.component.scss',
  ],
})
export class SistemaPalettePageComponent {}
