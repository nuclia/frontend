import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

import { UserContainerComponent } from '../user-container';
import { FarewellComponent } from './farewell.component';

@NgModule({
  imports: [
    CommonModule,

    RouterModule,
    UserContainerComponent,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    FarewellComponent,
  ],
  exports: [],
})
export class FarewellModule {}
