import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UploadDialogService, UploadType } from './upload-dialog.service';
import { FeaturesService } from '@flaps/core';

@Component({
  selector: 'stf-upload-button',
  templateUrl: './upload-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UploadButtonComponent {
  constructor(
    private uploadService: UploadDialogService,
    private features: FeaturesService,
  ) {}

  upload(type: UploadType) {
    this.uploadService.upload(type);
  }
}
