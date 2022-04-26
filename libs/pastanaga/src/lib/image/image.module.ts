import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ImageComponent } from './image.component';
import { STFButtonsModule } from '../buttons/buttons-module';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  imports: [CommonModule, STFButtonsModule, AngularSvgIconModule, FlexLayoutModule, TranslateModule.forChild()],
  declarations: [ImageComponent],
  exports: [ImageComponent],
})
export class STFImageFieldModule {}
