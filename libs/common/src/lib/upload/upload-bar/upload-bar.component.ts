import { Component } from '@angular/core';
import { map } from 'rxjs';
import { UploadService } from '../upload.service';
import { UploadProgressDialogComponent } from '../upload-progress/upload-progress-dialog.component';
import { SisModalService } from '@nuclia/sistema';

@Component({
  selector: 'stf-upload-bar',
  templateUrl: './upload-bar.component.html',
  styleUrls: ['./upload-bar.component.scss'],
})
export class UploadBarComponent {
  progress = this.uploadService.progress.pipe(map((p) => p.progress));

  constructor(private modalService: SisModalService, private uploadService: UploadService) {}

  checkFiles() {
    this.modalService.openModal(UploadProgressDialogComponent);
  }

  close() {
    this.uploadService.disableBar();
  }
}
