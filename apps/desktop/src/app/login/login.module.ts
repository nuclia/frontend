import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { STFButtonsModule } from '@flaps/pastanaga';
import { TranslateModule } from '@ngx-translate/core';

import { LoginComponent } from './login.component';

@NgModule({
  imports: [CommonModule, STFButtonsModule, TranslateModule],
  exports: [LoginComponent],
  declarations: [LoginComponent],
  providers: [],
})
export class LoginModule {}
