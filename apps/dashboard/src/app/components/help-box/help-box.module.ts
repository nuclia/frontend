import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';

import { HelpBoxComponent } from './help-box.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, FlexLayoutModule, TranslateModule.forChild(), PaButtonModule],
  declarations: [HelpBoxComponent],
  exports: [HelpBoxComponent],
})
export class HelpBoxModule {}
