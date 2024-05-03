import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UploadDialogService, UploadType } from '../../resources/upload-button/upload-dialog.service';
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
      .subscribe(() => this.router.navigate(['../resources/pending'], { relativeTo: this.route }));
  }

  goToSynchronize() {
    this.router.navigate(['../sync'], { relativeTo: this.route });
  }
}
