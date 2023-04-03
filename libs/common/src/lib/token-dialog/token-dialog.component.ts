import { Component, OnInit, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

export interface TokenDialogData {
  token: string;
}

@Component({
  selector: 'app-token-dialog',
  templateUrl: './token-dialog.component.html',
  styleUrls: ['./token-dialog.component.scss'],
})
export class TokenDialogComponent implements OnInit {
  clipboardSuppordted: boolean = !!(navigator.clipboard && navigator.clipboard.writeText);
  successMessage: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<TokenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TokenDialogData,
  ) {}

  ngOnInit(): void {}

  copy() {
    navigator.clipboard.writeText(this.data.token);
    this.successMessage = true;
    setTimeout(() => {
      this.successMessage = false;
    }, 2000);
  }

  close(): void {
    this.dialogRef.close();
  }
}
