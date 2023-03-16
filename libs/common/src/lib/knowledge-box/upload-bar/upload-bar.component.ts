import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs';
import { UploadProgressDialogComponent, UploadService } from '../../upload';

@Component({
  selector: 'app-upload-bar',
  templateUrl: './upload-bar.component.html',
  styleUrls: ['./upload-bar.component.scss'],
})
export class UploadBarComponent {
  progress = this.uploadService.progress.pipe(map((p) => p.progress));

  constructor(private dialog: MatDialog, private uploadService: UploadService) {}

  checkFiles() {
    this.dialog.open(UploadProgressDialogComponent);
  }

  close() {
    this.uploadService.disableBar();
  }
}
