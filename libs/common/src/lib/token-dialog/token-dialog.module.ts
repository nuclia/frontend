import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';

import { TokenDialogComponent } from './token-dialog.component';
import { PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    MatDialogModule,
    PaButtonModule,
    PaModalModule,
  ],
  declarations: [TokenDialogComponent],
  exports: [TokenDialogComponent],
})
export class TokenDialogModule {}
