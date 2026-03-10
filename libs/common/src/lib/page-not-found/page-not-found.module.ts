import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from './page-not-found.component';
import { UserContainerComponent } from '@nuclia/user';

@NgModule({
  declarations: [PageNotFoundComponent],
  imports: [CommonModule, UserContainerComponent],
  exports: [PageNotFoundComponent],
})
export class PageNotFoundModule {}
