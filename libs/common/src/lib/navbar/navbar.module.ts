import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { PaFocusableModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';

import { NavbarComponent } from './navbar.component';
import { SmallNavbarDirective } from './small-navbar.directive';
import { SyncService } from '@nuclia/sync';
import { NewSyncService } from 'libs/sync/src/lib/sync/new-sync.service';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    PaIconModule,
    PaFocusableModule,
  ],
  declarations: [NavbarComponent, SmallNavbarDirective],
  exports: [NavbarComponent, SmallNavbarDirective],
})
export class NavbarModule {}
