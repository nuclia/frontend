import { ChangeDetectionStrategy, Component } from '@angular/core';
import { getDesktopAppUrl, getDesktopPlatform, RELEASE_URL } from '../../utils';
import { UploadDialogService, UploadType } from '../../resources';

@Component({
  selector: 'stf-upload-data',
  templateUrl: './upload-data.component.html',
  styleUrls: ['./upload-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadDataComponent {
  constructor(private uploadService: UploadDialogService) {}

  selectUpload(type: UploadType) {
    this.uploadService.upload(type).onClose.pipe().subscribe(console.log);
  }

  openDesktop() {
    const platform = getDesktopPlatform();
    if (platform) {
      getDesktopAppUrl(platform).subscribe((url) => {
        window.open(url || RELEASE_URL);
      });
    } else {
      window.open(RELEASE_URL);
    }
  }
}
