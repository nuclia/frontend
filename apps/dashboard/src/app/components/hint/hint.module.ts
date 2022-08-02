import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { STFExpanderModule } from '@flaps/pastanaga';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { HintComponent } from './hint.component';

@NgModule({
  imports: [CommonModule, STFExpanderModule, AngularSvgIconModule],
  exports: [HintComponent],
  declarations: [HintComponent],
  providers: [],
})
export class HintModule {}
