import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormatDatePipe } from './format-date.pipe';
import { SafeHtmlPipe } from './safe-html.pipe';
import { FormatTimePipe } from './format-time.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [FormatDatePipe, FormatTimePipe, SafeHtmlPipe],
  exports: [FormatDatePipe, FormatTimePipe, SafeHtmlPipe],
})
export class PipesModule {}
