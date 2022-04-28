import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

import { TagComponent } from './tag/tag.component';

@NgModule({
  declarations: [TagComponent],
  imports: [CommonModule, TranslateModule.forChild(), FlexLayoutModule, AngularSvgIconModule, MatIconModule],
  exports: [TagComponent],
})
export class STFTagModule {}
