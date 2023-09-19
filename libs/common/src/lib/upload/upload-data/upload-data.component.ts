import { ChangeDetectionStrategy, Component } from '@angular/core';
import { getDesktopAppUrl, getDesktopPlatform, RELEASE_URL } from '../../utils';
import { UploadDialogService, UploadType } from '../../resources';
import { filter } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'stf-upload-data',
  templateUrl: './upload-data.component.html',
  styleUrls: ['./upload-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadDataComponent {
  constructor(
    private uploadService: UploadDialogService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  selectUpload(type: UploadType) {
    this.uploadService
      .upload(type)
      .onClose.pipe(filter((data) => !data || !data.cancel))
      .subscribe(() => this.router.navigate(['../resources'], { relativeTo: this.route }));
  }

  downloadDesktop() {
    const platform = getDesktopPlatform();
    if (platform) {
      getDesktopAppUrl(platform).subscribe((url) => {
        window.open(url || RELEASE_URL);
      });
    } else {
      window.open(RELEASE_URL);
    }
  }

  openDesktop() {
    window.open('nuclia-desktop://index.html');
  }
}
