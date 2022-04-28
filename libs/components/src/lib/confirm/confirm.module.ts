import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { STFButtonsModule } from '@flaps/pastanaga';
import { FlexLayoutModule } from '@angular/flex-layout';
import { STFConfirmComponent } from './confirm.component';

@NgModule({
  declarations: [STFConfirmComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    TranslateModule.forChild(),
    AngularSvgIconModule,
    STFButtonsModule,
    FlexLayoutModule,
  ],
  exports: [STFConfirmComponent],
})
export class STFConfirmModule {}
