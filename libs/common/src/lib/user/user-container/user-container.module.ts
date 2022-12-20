import { NgModule } from '@angular/core';
import { UserContainerComponent } from './user-container.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [UserContainerComponent],
  exports: [UserContainerComponent],
  imports: [CommonModule],
})
export class UserContainerModule {}
