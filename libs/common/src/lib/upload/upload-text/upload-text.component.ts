import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Classification, TextFieldFormat } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { forkJoin, switchMap } from 'rxjs';
import { markForCheck } from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { parseCsvLabels } from '../utils';

const FORMATS = ['PLAIN', 'MARKDOWN', 'HTML', 'RST'];

interface Row {
  title: string;
  body: string;
  format: TextFieldFormat;
  labels: Classification[];
}

@Component({
  selector: 'app-upload-text',
  templateUrl: './upload-text.component.html',
  styleUrls: ['../_upload-dialog.scss', './upload-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadTextComponent {
  isUploading = false;
  csv: Row[] = [];

  constructor(
    private dialogRef: MatDialogRef<UploadTextComponent>,
    private sdk: SDKService,
    private uploadService: UploadService,
    private tracking: STFTrackingService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  close(): void {
    this.dialogRef.close({ cancel: true });
  }

  checkCsv(data: string[][]) {
    const csv = data.map((row) => ({
      title: row[0],
      body: row[1],
      format: row[2] as TextFieldFormat,
      labels: parseCsvLabels(row[3]),
    }));
    if (csv.every((row) => FORMATS.includes(row.format) && !!row.labels)) {
      this.csv = csv as Row[];
      markForCheck(this.cdr);
    } else {
      this.toaster.error('upload.invalid_csv');
    }
  }

  upload() {
    this.tracking.logEvent('upload_text_from_csv');
    this.isUploading = true;
    markForCheck(this.cdr);
    const allLabels = this.csv.reduce((acc, current) => acc.concat(current.labels), [] as Classification[]);
    this.uploadService
      .createMissingLabels(allLabels)
      .pipe(
        switchMap(() =>
          forkJoin(
            this.csv.map((row) => this.uploadService.uploadTextResource(row.title, row.body, row.format, row.labels)),
          ),
        ),
      )
      .subscribe(() => this.dialogRef.close());
  }
}
