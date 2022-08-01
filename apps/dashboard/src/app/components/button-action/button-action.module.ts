import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { ButtonActionComponent } from './button-action.component';

@NgModule({
  imports: [CommonModule, AngularSvgIconModule, TranslateModule.forChild()],
  declarations: [ButtonActionComponent],
  exports: [ButtonActionComponent],
})
export class ButtonActionModule {}
