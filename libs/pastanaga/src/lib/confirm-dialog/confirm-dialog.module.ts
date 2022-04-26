import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { STFConfirmDialogComponent } from './confirm-dialog.component';

@NgModule({
  declarations: [STFConfirmDialogComponent],
  imports: [MatDialogModule, MatButtonModule],
})
export class STFConfirmDialogModule {}
