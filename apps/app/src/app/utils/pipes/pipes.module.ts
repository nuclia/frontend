import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormatDatePipe, FormatTimePipe } from './format-date.pipe';


@NgModule({
  imports: [CommonModule],
  declarations: [FormatDatePipe, FormatTimePipe],
  exports: [FormatDatePipe, FormatTimePipe],
})
export class PipesModule {}
