import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TextareaComponent } from './textarea.component';

@NgModule({
  imports: [CommonModule, TranslateModule.forChild()],
  declarations: [TextareaComponent],
  exports: [TextareaComponent],
})
export class STFTextFieldModule {}
