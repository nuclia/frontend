import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InviteComponent } from './invite.component';
import { TranslateModule } from '@ngx-translate/core';
import { UserContainerComponent } from '../user-container';
import { PasswordFormComponent } from './password-form.component';

@NgModule({
  declarations: [InviteComponent],
  imports: [CommonModule, PasswordFormComponent, TranslateModule, UserContainerComponent],
})
export class InviteModule {}
