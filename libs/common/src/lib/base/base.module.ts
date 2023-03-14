import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseComponent } from './base.component';
import { TopbarModule } from '../topbar';

@NgModule({
  declarations: [BaseComponent],
  exports: [BaseComponent],
  imports: [RouterModule, TopbarModule],
})
export class BaseModule {}
