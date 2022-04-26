import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { STFSidebarComponent } from './sidebar.component';

@NgModule({
  declarations: [STFSidebarComponent],
  imports: [CommonModule],
  exports: [STFSidebarComponent],
})
export class STFSidebarModule {}
