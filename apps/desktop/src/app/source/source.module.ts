import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SourceComponent } from './source.component';

@NgModule({
  imports: [RouterModule, CommonModule],
  exports: [],
  declarations: [SourceComponent],
  providers: [],
})
export class SourceModule {}
