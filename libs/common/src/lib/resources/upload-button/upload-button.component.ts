import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UploadDialogService } from './upload-dialog.service';

@Component({
  selector: 'stf-upload-button',
  templateUrl: './upload-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadButtonComponent implements OnInit {
  @Output() uploaded = new EventEmitter();

  constructor(private uploadService: UploadDialogService) {}

  ngOnInit(): void {}

  upload(type: 'files' | 'folder' | 'link' | 'csv') {
    this.uploadService
      .upload(type)
      .afterClosed()
      .subscribe((data) => {
        if (!data || !data.cancel) {
          this.uploaded.emit();
        }
      });
  }
}
