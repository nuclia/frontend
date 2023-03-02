import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './spinner/spinner.component';
import { DelayedSpinnerComponent } from './delayed-spinner/delayed-spinner.component';

@NgModule({
  declarations: [SpinnerComponent, DelayedSpinnerComponent],
  imports: [CommonModule],
  exports: [SpinnerComponent, DelayedSpinnerComponent],
})
export class SisProgressModule {}
