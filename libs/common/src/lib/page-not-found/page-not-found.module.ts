import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from './page-not-found.component';
import { UserContainerComponent } from '@nuclia/user';

@NgModule({
    imports: [CommonModule, UserContainerComponent, PageNotFoundComponent],
    exports: [PageNotFoundComponent],
})
export class PageNotFoundModule {}
