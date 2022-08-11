import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { UserAvatarModule } from '@flaps/components';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { UserMenuModule } from '../user-menu/user-menu.module';

import { TopbarComponent } from './topbar.component';
import { KbSwitchComponent } from './kb-switch/kb-switch.component';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [
    CommonModule,
    UserAvatarModule,
    AngularSvgIconModule,
    OverlayModule,
    UserMenuModule,
    TourMatMenuModule,
    TranslateModule,
    PaIconModule,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTooltipModule,
  ],
  exports: [TopbarComponent],
  declarations: [TopbarComponent, KbSwitchComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TopbarModule {}
