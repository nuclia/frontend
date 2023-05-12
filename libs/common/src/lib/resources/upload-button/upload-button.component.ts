import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UploadDialogService } from './upload-dialog.service';

@Component({
  selector: 'stf-upload-button',
  templateUrl: './upload-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadButtonComponent implements OnInit {
  constructor(private uploadService: UploadDialogService) {}

  ngOnInit(): void {}

  upload(type: 'files' | 'folder' | 'link' | 'csv') {
    this.uploadService.upload(type);
  }
}
