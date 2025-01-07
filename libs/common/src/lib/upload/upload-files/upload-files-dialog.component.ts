import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-upload-files-dialog',
  template: `
    <app-upload-files
      *ngIf="!showProgress"
      [folderMode]="modal.config.data?.['folderMode']"
      (upload)="onUpload()"
      (close)="close($event)"></app-upload-files>
    <app-upload-progress
      *ngIf="showProgress"
      (close)="close()"></app-upload-progress>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UploadFilesDialogComponent {
  showProgress: boolean = false;

  constructor(public modal: ModalRef) {}

  onUpload() {
    this.showProgress = true;
  }

  close($event?: { cancel: boolean }): void {
    this.modal.close($event);
  }
}
