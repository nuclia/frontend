import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { PaginationComponent } from './pagination.component';

@NgModule({
  declarations: [PaginationComponent],
  imports: [CommonModule, FlexLayoutModule, TranslateModule.forChild()],
  exports: [PaginationComponent],
})
export class PaginationModule {}
