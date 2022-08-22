import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordInputComponent } from './password-input.component';
import { PaButtonModule, PaFormFieldModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [PasswordInputComponent],
  exports: [PasswordInputComponent],
  imports: [CommonModule, PaFormFieldModule, ReactiveFormsModule, PaTextFieldModule, PaButtonModule],
})
export class PasswordInputModule {}
