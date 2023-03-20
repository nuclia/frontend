import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { UserAvatarModule } from '@flaps/components';
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
    UserAvatarModule,
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
  ],
  exports: [TopbarComponent],
  declarations: [TopbarComponent, KbSwitchComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TopbarModule {}
