import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-users-dialog',
  templateUrl: './users-dialog.component.html',
  styleUrls: ['./users-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { kb: string },
    private dialogRef: MatDialogRef<UsersDialogComponent>,
  ) {}

  close() {
    this.dialogRef.close();
  }
}
