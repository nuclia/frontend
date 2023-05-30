import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SelectAccountComponent } from './account.component';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, RouterModule, PaIconModule],
  exports: [SelectAccountComponent],
  declarations: [SelectAccountComponent],
  providers: [],
})
export class AccountModule {}
