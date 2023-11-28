import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { MainLayoutComponent } from './main-layout.component';
import { SidebarComponent } from './sidebar.component';
import { PaButtonModule, PaIconModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [
    AngularSvgIconModule,
    RouterModule,
    CommonModule,
    TranslateModule,
    PaButtonModule,
    PaIconModule,
    PaTooltipModule,
  ],
  exports: [],
  declarations: [MainLayoutComponent, SidebarComponent],
})
export class MainLayoutModule {}
