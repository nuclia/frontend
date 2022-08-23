import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { STFInputComponent } from './input.component';

@NgModule({
  declarations: [STFInputComponent],
  imports: [CommonModule, TextFieldModule, AngularSvgIconModule, ReactiveFormsModule],
  exports: [TextFieldModule, STFInputComponent],
})
export class STFInputModule {}
