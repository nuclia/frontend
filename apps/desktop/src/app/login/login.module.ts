import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LoginComponent } from './login.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, TranslateModule, PaButtonModule],
  exports: [LoginComponent],
  declarations: [LoginComponent],
  providers: [],
})
export class LoginModule {}
