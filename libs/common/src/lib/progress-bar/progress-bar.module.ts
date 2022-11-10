import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarComponent } from './progress-bar.component';

@NgModule({
  declarations: [ProgressBarComponent],
  imports: [CommonModule],
  exports: [ProgressBarComponent],
})
export class ProgressBarModule {}
