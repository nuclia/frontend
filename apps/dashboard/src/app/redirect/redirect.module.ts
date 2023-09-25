import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';

import { RedirectComponent } from './redirect.component';

@NgModule({
  imports: [CommonModule, PaButtonModule, PaIconModule, TranslateModule.forChild()],
  exports: [],
  declarations: [RedirectComponent],
  providers: [],
})
export class RedirectModule {}
