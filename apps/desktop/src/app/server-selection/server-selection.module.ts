import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerSelectionComponent } from './server-selection.component';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [ServerSelectionComponent],
  imports: [CommonModule, PaButtonModule, TranslateModule, PaTextFieldModule],
})
export class ServerSelectionModule {}
