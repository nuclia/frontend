import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';


import { STFMaterialColorPickerComponent } from './material-color-picker.component';

@NgModule({
  declarations: [STFMaterialColorPickerComponent],
  imports: [
    CommonModule,

    FlexLayoutModule,

    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,

  ],
  exports: [STFMaterialColorPickerComponent],
})
export class STFMaterialColorPickerModule {}
