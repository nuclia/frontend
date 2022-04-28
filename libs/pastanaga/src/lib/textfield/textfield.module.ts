import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TextareaComponent } from './textarea.component';
import { STFButtonsModule } from '../buttons/buttons-module';

@NgModule({
  imports: [CommonModule, STFButtonsModule, TranslateModule.forChild()],
  declarations: [TextareaComponent],
  exports: [TextareaComponent],
})
export class STFTextFieldModule {}
