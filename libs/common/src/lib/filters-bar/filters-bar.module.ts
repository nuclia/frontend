import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FiltersBarComponent } from './filters-bar.component';

@NgModule({
  declarations: [FiltersBarComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    AngularSvgIconModule
  ],
  exports: [FiltersBarComponent],
})
export class FiltersBarModule {}