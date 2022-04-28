import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterInputDirective } from './form-directives';
import { SelectDirective } from './form-directives';

@NgModule({
  imports: [CommonModule],
  declarations: [FilterInputDirective, SelectDirective],
  exports: [FilterInputDirective, SelectDirective],
})
export class STFFormDirectivesModule {}
