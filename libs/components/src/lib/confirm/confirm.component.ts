import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';

export interface ConfirmData {
  title?: string;
  title$?: Observable<string>;
  message?: string;
  message$?: Observable<string>;
  messageHtml$?: Observable<string>;
  messages?: string[];
  confirmText?: string;
  cancelText?: string;
  minWidthButtons?: string;
  onlyConfirm?: boolean;
}

@Component({
  selector: 'stf-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class STFConfirmComponent {
  constructor(public dialogRef: MatDialogRef<STFConfirmComponent>, @Inject(MAT_DIALOG_DATA) public data: ConfirmData) {}

  onYesClick(): void {
    this.dialogRef.close(true);
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
