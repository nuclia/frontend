import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaginationComponent } from './pagination.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  declarations: [PaginationComponent],
  imports: [CommonModule, TranslateModule.forChild(), PaButtonModule],
  exports: [PaginationComponent],
})
export class PaginationModule {}
