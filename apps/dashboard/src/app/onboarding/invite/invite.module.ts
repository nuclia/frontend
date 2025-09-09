import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InviteComponent } from './invite.component';
import { TranslateModule } from '@ngx-translate/core';
import { UserContainerModule } from '@nuclia/user';
import { PasswordFormComponent } from './password-form.component';

@NgModule({
  declarations: [InviteComponent],
  imports: [CommonModule, PasswordFormComponent, TranslateModule, UserContainerModule],
})
export class InviteModule {}
