import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonSkipDirective } from './button-directives';

@NgModule({
  imports: [CommonModule],
  declarations: [ButtonSkipDirective],
  exports: [ButtonSkipDirective],
})
export class STFButtonDirectivesModule {}
