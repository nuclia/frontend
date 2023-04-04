import { Component } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { map } from 'rxjs';
import { UploadService } from '../upload.service';
import { UploadProgressDialogComponent } from '../upload-progress/upload-progress-dialog.component';

@Component({
  selector: 'stf-upload-bar',
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
