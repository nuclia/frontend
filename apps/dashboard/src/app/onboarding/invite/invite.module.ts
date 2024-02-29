import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InviteComponent } from './invite.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { UserContainerModule } from '@nuclia/user';

@NgModule({
  declarations: [InviteComponent],
  imports: [CommonModule, ReactiveFormsModule, PaTextFieldModule, PaButtonModule, TranslateModule, UserContainerModule],
})
export class InviteModule {}
