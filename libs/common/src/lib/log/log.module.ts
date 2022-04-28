import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogComponent } from './log.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [LogComponent],
  imports: [CommonModule, FlexLayoutModule],
  exports: [LogComponent],
})
export class LogModule {}
