import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { UserMenuModule } from '../user-menu';

import { TopbarComponent } from './topbar.component';
import { KbSwitchComponent } from './kb-switch/kb-switch.component';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    OverlayModule,
    UserMenuModule,
    TranslateModule,
    PaIconModule,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTooltipModule,
    DropdownButtonComponent,
    RouterModule,
  ],
  exports: [TopbarComponent],
  declarations: [TopbarComponent, KbSwitchComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TopbarModule {}
