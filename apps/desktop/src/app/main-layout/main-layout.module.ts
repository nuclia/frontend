import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { STFButtonsModule } from '@flaps/pastanaga';

import { MainLayoutComponent } from './main-layout.component';
import { TopbarComponent } from './topbar.component';

@NgModule({
  imports: [
    AngularSvgIconModule,
    RouterModule,
    CommonModule,
    TranslateModule,
    OverlayModule,
    STFButtonsModule,
  ],
  exports: [],
  declarations: [MainLayoutComponent, TopbarComponent],
  providers: [],
})
export class MainLayoutModule {}
