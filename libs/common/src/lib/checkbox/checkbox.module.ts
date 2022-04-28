import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { STFCheckboxComponent } from './checkbox.component';
import { CheckboxGroupComponent } from './checkbox-group/checkbox-group.component';

@NgModule({
  declarations: [STFCheckboxComponent, CheckboxGroupComponent],
  imports: [
    AngularSvgIconModule,
    CommonModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
  ],
  exports: [STFCheckboxComponent, CheckboxGroupComponent],
})
export class STFCheckboxModule {}