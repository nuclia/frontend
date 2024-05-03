import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { PaFocusableModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';

import { NavbarComponent } from './navbar.component';
import { SmallNavbarDirective } from './small-navbar.directive';
import { BadgeComponent } from '@nuclia/sistema';
import { UnauthorizedFeatureDirective } from '@flaps/core';

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
  ],
  declarations: [NavbarComponent, SmallNavbarDirective],
  exports: [NavbarComponent, SmallNavbarDirective],
})
export class NavbarModule {}
