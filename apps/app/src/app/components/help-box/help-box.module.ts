import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { STFButtonsModule } from '@flaps/pastanaga';

import { HelpBoxComponent } from './help-box.component';

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    STFButtonsModule,
  ],
  declarations: [HelpBoxComponent],
  exports: [HelpBoxComponent],
})
export class HelpBoxModule {}
