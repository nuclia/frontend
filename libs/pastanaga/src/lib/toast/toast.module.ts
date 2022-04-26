import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './toast.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { STFButtonsModule } from '../buttons/buttons-module';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  imports: [CommonModule, MatTooltipModule, STFButtonsModule, AngularSvgIconModule],
  exports: [ToastComponent],
  declarations: [ToastComponent],
})
export class ToasterModule {}
