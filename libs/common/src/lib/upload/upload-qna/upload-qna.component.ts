import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { StandaloneService } from '../../services';
import { UploadService } from '../upload.service';
import { STFTrackingService } from '@flaps/core';
import { FormControl, Validators } from '@angular/forms';
import { TextFormat } from '@nuclia/core';

@Component({
  selector: 'nuclia-upload-qna',
  templateUrl: './upload-qna.component.html',
  styleUrls: ['./upload-qna.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UploadQnaComponent {
  standalone = this.standaloneService.standalone;
  hasValidKey = this.standaloneService.hasValidKey;

  isUploading = false;
  resourceTitle = new FormControl<string>(`Q&A ${new Date().toISOString().split('T')[0]}`, {
    nonNullable: true,
    validators: [Validators.required],
  });
  questionFormat = new FormControl<TextFormat>('PLAIN', { nonNullable: true });
  answerFormat = new FormControl<TextFormat>('PLAIN', { nonNullable: true });
  qna: string[][] = [];

  constructor(
    public modal: ModalRef,
    private uploadService: UploadService,
    private standaloneService: StandaloneService,
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
  ) {}

  close(): void {
    this.modal.close({ cancel: true });
  }

  displayCsv(data: string[][]) {
    this.qna = data;
    this.cdr.markForCheck();
  }

  upload() {
    if (this.resourceTitle.valid && this.qna.length > 0) {
      this.tracking.logEvent('upload_q_and_a_from_csv');
      this.isUploading = true;
      this.uploadService
        .uploadQnaResource(
          this.resourceTitle.getRawValue(),
          this.qna,
          this.questionFormat.getRawValue(),
          this.answerFormat.getRawValue(),
        )
        .subscribe({
          next: () => this.modal.close(),
          error: () => {
            this.isUploading = false;
            this.cdr.markForCheck();
          },
        });
    }
  }
}
