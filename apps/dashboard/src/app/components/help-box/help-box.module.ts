import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { STFButtonsModule } from '@flaps/pastanaga';

import { HelpBoxComponent } from './help-box.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, FlexLayoutModule, TranslateModule.forChild(), STFButtonsModule, PaButtonModule],
  declarations: [HelpBoxComponent],
  exports: [HelpBoxComponent],
})
export class HelpBoxModule {}
