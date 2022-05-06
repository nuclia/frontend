import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { STFCheckboxModule } from '@flaps/common';
import { STFButtonsModule, STFInputModule } from '@flaps/pastanaga';
import { TranslateModule } from '@ngx-translate/core';

import { SourceComponent } from './source.component';

@NgModule({
  imports: [RouterModule, CommonModule, STFInputModule, STFButtonsModule, TranslateModule, STFCheckboxModule],
  exports: [],
  declarations: [SourceComponent],
  providers: [],
})
export class SourceModule {}
