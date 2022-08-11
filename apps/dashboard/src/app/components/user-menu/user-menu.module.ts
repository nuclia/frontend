import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { UserMenuComponent } from './user-menu.component';
import { PaAvatarModule, PaDropdownModule, PaIconModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, TranslateModule, PaIconModule, PaAvatarModule, PaDropdownModule, PaPopupModule],
  exports: [UserMenuComponent],
  declarations: [UserMenuComponent],
  providers: [],
})
export class UserMenuModule {}
