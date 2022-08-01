import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { UserMenuComponent } from './user-menu.component';

@NgModule({
  imports: [CommonModule, AngularSvgIconModule, TranslateModule],
  exports: [UserMenuComponent],
  declarations: [UserMenuComponent],
  providers: [],
})
export class UserMenuModule {}
