import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MimeIconPipe } from './mime-icon.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [MimeIconPipe],
  exports: [MimeIconPipe],
})
export class STFIconsModule {}
