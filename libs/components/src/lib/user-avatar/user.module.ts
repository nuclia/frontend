import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserComponent } from './user/user.component';
import { UserAvatarSimpleComponent } from './user-avatar-simple/user-avatar-simple.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [UserComponent, UserAvatarSimpleComponent],
  imports: [CommonModule, FlexLayoutModule],
  exports: [UserComponent, UserAvatarSimpleComponent],
})
export class UserAvatarModule {}
