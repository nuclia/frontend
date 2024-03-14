import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ServerSetupComponent } from './server-setup.component';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaTextFieldModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, TranslateModule, PaButtonModule, PaTextFieldModule, PaTooltipModule, ReactiveFormsModule],
  exports: [],
  declarations: [ServerSetupComponent],
  providers: [],
})
export class ServerSetupModule {}
