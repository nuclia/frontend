import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

import { RedirectComponent } from './redirect.component';

@NgModule({
  imports: [CommonModule, PaButtonModule, PaIconModule, TranslateModule.forChild(), PaTogglesModule],
  exports: [],
  declarations: [RedirectComponent],
  providers: [],
})
export class RedirectModule {}
