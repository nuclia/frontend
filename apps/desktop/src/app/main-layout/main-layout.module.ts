import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { OverlayModule } from '@angular/cdk/overlay';

import { MainLayoutComponent } from './main-layout.component';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';
import {
  PaAvatarModule,
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [
    AngularSvgIconModule,
    RouterModule,
    CommonModule,
    TranslateModule,
    OverlayModule,
    PaButtonModule,
    PaAvatarModule,
    PaDropdownModule,
    PaPopupModule,
    PaIconModule,
    PaTooltipModule,
  ],
  exports: [],
  declarations: [MainLayoutComponent, SidebarComponent, TopbarComponent],
})
export class MainLayoutModule {}
