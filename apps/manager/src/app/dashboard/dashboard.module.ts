import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule } from '@angular/material/dialog';

import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatBottomSheetModule,
    // MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatToolbarModule,
    // BrowserAnimationsModule,
    // HttpClientModule,
    // SvgModule,
    RouterModule,
    TranslateModule.forChild(),
  ],
  exports: [RouterModule, DashboardComponent],
})
export class DashboardModule {}
