import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { TopbarComponent } from './topbar.component';
import { BaseLayoutComponent } from './base-layout.component';
import { PaAvatarModule, PaButtonModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [
    AngularSvgIconModule,
    RouterModule,
    CommonModule,
    TranslateModule,
    PaButtonModule,
    PaAvatarModule,
    PaDropdownModule,
    PaPopupModule,
  ],
  exports: [],
  declarations: [BaseLayoutComponent, TopbarComponent],
})
export class BaseLayoutModule {}
