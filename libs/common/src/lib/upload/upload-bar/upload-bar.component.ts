import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UploadService } from '@flaps/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressBarComponent, SisModalService } from '@nuclia/sistema';
import { map } from 'rxjs';
import { UploadProgressDialogComponent } from '../upload-progress/upload-progress-dialog.component';

@Component({
  selector: 'stf-upload-bar',
  templateUrl: './upload-bar.component.html',
  styleUrls: ['./upload-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, PaButtonModule, ProgressBarComponent, TranslateModule],
})
export class UploadBarComponent {
  private modalService = inject(SisModalService);
  private uploadService = inject(UploadService);
  progress = this.uploadService.progress.pipe(map((p) => p.progress));

  checkFiles() {
    this.modalService.openModal(UploadProgressDialogComponent);
  }

  close() {
    this.uploadService.disableBar();
  }
}
