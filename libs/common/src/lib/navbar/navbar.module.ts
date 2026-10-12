import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PaFocusableModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { UnauthorizedFeatureDirective } from '@flaps/core';
import { BadgeComponent } from '@nuclia/sistema';
import { NavbarComponent } from './navbar.component';
import { SmallNavbarDirective } from './small-navbar.directive';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    PaIconModule,
    PaFocusableModule,
    BadgeComponent,
    UnauthorizedFeatureDirective,
    NavbarComponent,
    SmallNavbarDirective,
  ],
  exports: [NavbarComponent, SmallNavbarDirective],
})
export class NavbarModule {}
