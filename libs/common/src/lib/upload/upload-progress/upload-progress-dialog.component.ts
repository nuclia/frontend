import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { UploadProgressComponent } from './upload-progress.component';

@Component({
  selector: 'app-upload-progress-dialog',
  template: `
    <app-upload-progress (close)="close()"></app-upload-progress>
  `,
  styleUrls: ['./upload-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UploadProgressComponent],
})
export class UploadProgressDialogComponent {
  constructor(public modal: ModalRef) {}

  close(): void {
    this.modal.close();
  }
}
