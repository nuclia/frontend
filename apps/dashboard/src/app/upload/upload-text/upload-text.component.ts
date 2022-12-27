import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Classification, TextFieldFormat } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { forkJoin } from 'rxjs';
import { markForCheck } from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { parseCSV } from '../utils';

@Component({
  selector: 'app-upload-text',
  templateUrl: './upload-text.component.html',
  styleUrls: ['./upload-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadTextComponent {
  isUploading = false;
  resources: string[][] = [];
  selectedLabels: Classification[] = [];

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
          this.resources = resources;
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
    forkJoin(
      this.resources.map((resource) =>
        this.uploadService.uploadTextResource(
          resource[0],
          resource[1],
          resource[2] as TextFieldFormat,
          this.selectedLabels,
        ),
      ),
    ).subscribe(() => this.dialogRef.close());
  }

  isValidCSV(data: string[][]) {
    return data.every((row) => row.length === 3 && ['PLAIN', 'MARKDOWN', 'HTML', 'RST'].includes(row[2]));
  }
}
