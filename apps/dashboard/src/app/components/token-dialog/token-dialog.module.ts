import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialogModule } from '@angular/material/dialog';
import { STFButtonsModule } from '@flaps/pastanaga';

import { TokenDialogComponent } from './token-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    MatDialogModule,
    STFButtonsModule,
  ],
  declarations: [TokenDialogComponent],
  exports: [TokenDialogComponent],
})
export class TokenDialogModule {}
