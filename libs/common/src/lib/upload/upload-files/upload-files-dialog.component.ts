import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface UploadFileDialogData {
  folderMode: boolean;
}

@Component({
  selector: 'app-upload-files-dialog',
  template: `
    <div>
      <app-upload-files
        *ngIf="!showProgress"
        [folderMode]="data.folderMode"
        (upload)="onUpload()"
        (close)="close($event)"></app-upload-files>
      <app-upload-progress
        *ngIf="showProgress"
        (close)="close()"></app-upload-progress>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFilesDialogComponent {
  showProgress: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<UploadFilesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UploadFileDialogData,
  ) {}

  onUpload() {
    this.showProgress = true;
  }

  close($event?: { cancel: boolean }): void {
    this.dialogRef.close($event);
  }
}
