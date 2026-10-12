import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { PaDropdownModule, PaIconModule, PaPopupModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { KbSwitchComponent } from './kb-switch/kb-switch.component';
import { PlanStatusComponent } from './plan-status/plan-status.component';
import { TopbarComponent } from './topbar.component';
import { UserMenuComponent } from './user-menu';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    OverlayModule,
    TranslateModule,
    PaIconModule,
    PaDropdownModule,
    PaPopupModule,
    PaTooltipModule,
    DropdownButtonComponent,
    RouterModule,
    UserMenuComponent,
    PlanStatusComponent,
    TopbarComponent,
    KbSwitchComponent,
  ],
  exports: [TopbarComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TopbarModule {}
