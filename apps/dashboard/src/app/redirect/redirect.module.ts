import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

import { RedirectComponent } from './redirect.component';

@NgModule({
  imports: [CommonModule, PaButtonModule, TranslateModule.forChild()],
  exports: [],
  declarations: [RedirectComponent],
  providers: [],
})
export class RedirectModule {}
