import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatDialogModule } from '@angular/material/dialog';

import { AddWidgetDialogComponent } from './add-widget.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    MatDialogModule,
    PaButtonModule,
    PaTextFieldModule,
    ReactiveFormsModule,
  ],
  declarations: [AddWidgetDialogComponent],
  exports: [AddWidgetDialogComponent],
})
export class AddWidgetDialogModule {}
