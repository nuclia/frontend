import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Classification, TextFieldFormat } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { forkJoin, switchMap } from 'rxjs';
import { markForCheck } from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { parseCSV } from '../utils';

const SLUG_REGEX = /^[a-zA-Z0-9-_]+$/;
const FORMATS = ['PLAIN', 'MARKDOWN', 'HTML', 'RST'];

@Component({
  selector: 'app-upload-text',
  templateUrl: './upload-text.component.html',
  styleUrls: ['./upload-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadTextComponent {
  isUploading = false;
  resources: [string, string, string, Classification[]][] = [];

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
      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');
      reader.onload = () => {
        const resources = parseCSV(reader.result as string);
        if (this.isValidCSV(resources)) {
          this.resources = resources.map((item) => [item[0], item[1], item[2], this.parseLabels(item[3])!]);
          markForCheck(this.cdr);
        } else {
          this.toaster.error('upload.invalid_csv');
        }
      };
    }
  }

  upload() {
    this.tracking.logEvent('upload_text_from_csv');
    this.isUploading = true;
    markForCheck(this.cdr);
    const allLabels = this.resources.reduce((acc, current) => acc.concat(current[3]), [] as Classification[]);
    this.uploadService
      .createMissingLabels(allLabels)
      .pipe(
        switchMap(() =>
          forkJoin(
            this.resources.map((item) =>
              this.uploadService.uploadTextResource(item[0], item[1], item[2] as TextFieldFormat, item[3]),
            ),
          ),
        ),
      )
      .subscribe(() => this.dialogRef.close());
  }

  isValidCSV(data: string[][]) {
    return data.every((row) => row.length === 4 && FORMATS.includes(row[2]) && !!this.parseLabels(row[3]));
  }

  // Parse labels like: 'labelset1/label1|labelset2/label2'
  parseLabels(labels: string): Classification[] | null {
    if (labels.length === 0) return [];
    let isValid = true;
    const parsedLabels = labels.split('|').map((label) => {
      const items = label.split('/');
      isValid &&= items.length === 2 && SLUG_REGEX.test(items[0].trim()) && items[1].trim().length > 0;
      return { labelset: items[0]?.trim(), label: items[1]?.trim() };
    });
    return isValid ? parsedLabels : null;
  }
}
