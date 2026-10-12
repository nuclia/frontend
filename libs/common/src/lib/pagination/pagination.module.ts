import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { PaginationComponent } from './pagination.component';

@NgModule({
  imports: [CommonModule, PaButtonModule, PaginationComponent],
  exports: [PaginationComponent],
})
export class PaginationModule {}
