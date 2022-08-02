import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PaExpanderModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { HintComponent } from './hint.component';

@NgModule({
  imports: [CommonModule, PaIconModule, PaExpanderModule],
  exports: [HintComponent],
  declarations: [HintComponent],
})
export class HintModule {}
