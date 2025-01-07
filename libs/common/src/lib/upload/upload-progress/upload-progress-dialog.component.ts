import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-upload-progress-dialog',
  template: `
    <app-upload-progress (close)="close()"></app-upload-progress>
  `,
  styleUrls: ['./upload-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UploadProgressDialogComponent {
  constructor(public modal: ModalRef) {}

  close(): void {
    this.modal.close();
  }
}
