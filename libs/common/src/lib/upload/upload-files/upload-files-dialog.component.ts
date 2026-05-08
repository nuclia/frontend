import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-upload-files-dialog',
  template: `
    @if (!showProgress) {
      <app-upload-files
        [folderMode]="modal.config.data?.['folderMode']"
        (upload)="onUpload()"
        (uploadClose)="close($event)"></app-upload-files>
    }
    @if (showProgress) {
      <app-upload-progress (progressClose)="close()"></app-upload-progress>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UploadFilesDialogComponent {
  showProgress = false;

  constructor(public modal: ModalRef) {}

  onUpload() {
    this.showProgress = true;
  }

  close($event?: { cancel: boolean }): void {
    this.modal.close($event);
  }
}
