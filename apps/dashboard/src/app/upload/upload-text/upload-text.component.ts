import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Classification, TextFieldFormat } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { forkJoin, switchMap } from 'rxjs';
import { markForCheck } from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { CSVSpecs, parseCSVLabels, readCSV } from '../utils';

const FORMATS = ['PLAIN', 'MARKDOWN', 'HTML', 'RST'];

@Component({
  selector: 'app-upload-text',
  templateUrl: './upload-text.component.html',
  styleUrls: ['../_upload-dialog.scss', './upload-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadTextComponent {
  isUploading = false;
  csv: [string, string, string, Classification[]][] = [];
  specs = CSVSpecs;

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

  readCSV(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      readCSV(file).subscribe((csv) => {
        const isValid = csv.every((row) => row.length === 4 && FORMATS.includes(row[2]) && !!parseCSVLabels(row[3]));
        if (isValid) {
          this.csv = csv.map((row) => [row[0], row[1], row[2], parseCSVLabels(row[3])!]);
          markForCheck(this.cdr);
        } else {
          this.toaster.error('upload.invalid_csv');
        }
      });
    }
  }

  upload() {
    this.tracking.logEvent('upload_text_from_csv');
    this.isUploading = true;
    markForCheck(this.cdr);
    const allLabels = this.csv.reduce((acc, current) => acc.concat(current[3]), [] as Classification[]);
    this.uploadService
      .createMissingLabels(allLabels)
      .pipe(
        switchMap(() =>
          forkJoin(
            this.csv.map((item) =>
              this.uploadService.uploadTextResource(item[0], item[1], item[2] as TextFieldFormat, item[3]),
            ),
          ),
        ),
      )
      .subscribe(() => this.dialogRef.close());
  }
}
