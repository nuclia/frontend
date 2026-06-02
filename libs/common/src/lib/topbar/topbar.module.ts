import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { TopbarComponent } from './topbar.component';
import { KbSwitchComponent } from './kb-switch/kb-switch.component';
import {
  PaButtonModule,
  PaDropdownModule,
  PaFocusableModule,
  PaIconModule,
  PaPopupModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { UserMenuComponent } from './user-menu';
import { StandaloneMenuComponent } from './standalone-menu/standalone-menu.component';
import { NotificationButtonComponent } from '@flaps/core';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    OverlayModule,
    TranslateModule,
    PaIconModule,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTooltipModule,
    DropdownButtonComponent,
    RouterModule,
    PaFocusableModule,
    UserMenuComponent,
    StandaloneMenuComponent,
    NotificationButtonComponent,
  ],
  exports: [TopbarComponent],
  declarations: [TopbarComponent, KbSwitchComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TopbarModule {}
