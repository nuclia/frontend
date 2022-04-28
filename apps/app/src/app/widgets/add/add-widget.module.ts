import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatDialogModule } from '@angular/material/dialog';
import { STFButtonsModule, STFInputModule } from '@flaps/pastanaga';

import { AddWidgetDialogComponent } from './add-widget.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    MatDialogModule,
    STFButtonsModule,
    STFInputModule,
    ReactiveFormsModule,
  ],
  declarations: [AddWidgetDialogComponent],
  exports: [AddWidgetDialogComponent],
})
export class AddWidgetDialogModule {}
