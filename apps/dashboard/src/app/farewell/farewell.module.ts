import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { FarewellComponent } from './farewell.component';
import { UserContainerModule } from '@flaps/common';

@NgModule({
  imports: [CommonModule, TranslateModule.forChild(), RouterModule, UserContainerModule],
  declarations: [FarewellComponent],
  exports: [],
})
export class FarewellModule {}
