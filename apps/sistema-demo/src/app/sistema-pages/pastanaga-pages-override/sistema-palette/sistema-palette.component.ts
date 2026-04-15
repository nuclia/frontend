import { Component } from '@angular/core';

import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';

@Component({
  imports: [PaDemoModule],
  templateUrl: './sistema-palette.component.html',
  styleUrls: [
    '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/palette-page/palette-page.component.scss',
    'sistema-palette.component.scss',
  ],
})
export class SistemaPalettePageComponent {}
