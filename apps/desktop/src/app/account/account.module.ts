import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SelectAccountComponent } from './account.component';

@NgModule({
  imports: [CommonModule, RouterModule],
  exports: [SelectAccountComponent],
  declarations: [SelectAccountComponent],
  providers: [],
})
export class AccountModule {}
