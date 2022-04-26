import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RichTextComponent } from './richtext.component';
import { STFButtonsModule } from '../buttons/buttons-module';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, STFButtonsModule, FormsModule, TranslateModule.forChild(), QuillModule],
  declarations: [RichTextComponent],
  exports: [RichTextComponent],
})
export class STFRichTextFieldModule {}
