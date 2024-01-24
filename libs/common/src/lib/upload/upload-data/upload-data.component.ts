import { ChangeDetectionStrategy, Component } from '@angular/core';
import { openDesktop } from '../../utils';
import { UploadDialogService, UploadType } from '../../resources/upload-button/upload-dialog.service';
import { filter } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FeaturesService } from '@flaps/core';

@Component({
  selector: 'stf-upload-data',
  templateUrl: './upload-data.component.html',
  styleUrls: ['./upload-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadDataComponent {
  isSyncEnabled = this.features.sync;
  constructor(
    private uploadService: UploadDialogService,
    private router: Router,
    private route: ActivatedRoute,
    private features: FeaturesService,
  ) {}

  selectUpload(type: UploadType) {
    this.uploadService
      .upload(type)
      .onClose.pipe(filter((data) => !data || !data.cancel))
      .subscribe(() => this.router.navigate(['../resources/pending'], { relativeTo: this.route }));
  }

  openDesktop() {
    openDesktop();
  }
}
