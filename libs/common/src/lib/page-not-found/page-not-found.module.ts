import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from './page-not-found.component';
import { UserContainerModule } from '../../../../user/src/lib';

@NgModule({
  declarations: [PageNotFoundComponent],
  imports: [CommonModule, UserContainerModule],
  exports: [PageNotFoundComponent],
})
export class PageNotFoundModule {}
