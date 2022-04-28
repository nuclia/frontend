import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-upload-progress-dialog',
  template: `
    <app-upload-progress (close)="close()"></app-upload-progress>
  `,
  styleUrls: ['./upload-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadProgressDialogComponent {

  constructor(private dialogRef: MatDialogRef<UploadProgressDialogComponent>) {}

  close(): void {
    this.dialogRef.close();
  }
}