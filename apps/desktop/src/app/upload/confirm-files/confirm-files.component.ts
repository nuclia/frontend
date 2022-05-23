import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SyncItem } from '../../sync/models';

@Component({
  selector: 'da-confirm-files',
  templateUrl: './confirm-files.component.html',
  styleUrls: ['./confirm-files.component.scss']
})
export class ConfirmFilesComponent {

  constructor(
    private dialogRef: MatDialogRef<ConfirmFilesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { files: SyncItem[] }
  ) {}

  close() {
    this.dialogRef.close(false);
  }

  upload() {
    this.dialogRef.close(true);
  }
}
