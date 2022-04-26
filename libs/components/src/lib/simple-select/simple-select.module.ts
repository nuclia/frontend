import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { SimpleSelectComponent } from './simple-select.component';

@NgModule({
  declarations: [SimpleSelectComponent],
  imports: [
    AngularSvgIconModule,
    CommonModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
  ],
  exports: [SimpleSelectComponent],
})
export class STFSimpleSelectModule {}