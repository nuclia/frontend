import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { STFInputComponent } from './input.component';
import { STFPasswordInputComponent } from './password-input/password-input.component';

@NgModule({
  declarations: [STFInputComponent, STFPasswordInputComponent],
  imports: [CommonModule, TextFieldModule, AngularSvgIconModule, ReactiveFormsModule],
  exports: [TextFieldModule, STFInputComponent, STFPasswordInputComponent],
})
export class STFInputModule {}
