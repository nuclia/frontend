import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ModalRef,
  PaButtonModule,
  PaDropdownModule,
  PaModalModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { TextFormat } from '@nuclia/core';
import { StandaloneService } from '../../services';
import { CsvSelectComponent } from '../csv-select/csv-select.component';
import { UploadService } from '../upload.service';

@Component({
  selector: 'nuclia-upload-qna',
  templateUrl: './upload-qna.component.html',
  styleUrls: ['./upload-qna.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PaModalModule,
    PaTextFieldModule,
    FormsModule,
    ReactiveFormsModule,
    PaDropdownModule,
    CsvSelectComponent,
    PaTableModule,
    PaButtonModule,
    AsyncPipe,
    TranslatePipe,
  ],
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
