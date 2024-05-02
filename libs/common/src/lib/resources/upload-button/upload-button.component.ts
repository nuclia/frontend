import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UploadDialogService, UploadType } from './upload-dialog.service';
import { FeaturesService } from '@flaps/core';

@Component({
  selector: 'stf-upload-button',
  templateUrl: './upload-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadButtonComponent implements OnInit {
  constructor(
    private uploadService: UploadDialogService,
    private features: FeaturesService,
  ) {}

  ngOnInit(): void {}

  upload(type: UploadType) {
    this.uploadService.upload(type);
  }
}
