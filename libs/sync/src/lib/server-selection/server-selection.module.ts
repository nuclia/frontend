import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ServerSelectionComponent } from './server-selection.component';
import { PaButtonModule, PaTextFieldModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ServerSetupComponent } from './server-setup.component';

@NgModule({
  declarations: [ServerSelectionComponent, ServerSetupComponent],
  imports: [CommonModule, PaButtonModule, ReactiveFormsModule, TranslateModule, PaTextFieldModule, PaTooltipModule],
})
export class ServerSelectionModule {}
