import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Classification, TextFieldFormat, TextFormat } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { forkJoin, switchMap, take, tap } from 'rxjs';
import { markForCheck, ModalRef } from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { parseCsvLabels } from '../csv-parser';
import { StandaloneService } from '../../services';
import { PENDING_RESOURCES_LIMIT } from '../upload.utils';

const FORMATS: TextFormat[] = ['PLAIN', 'MARKDOWN', 'KEEP_MARKDOWN', 'HTML', 'RST'];

interface Row {
  title: string;
  body: string;
  format: TextFieldFormat;
  labels: Classification[];
}

@Component({
  selector: 'app-upload-text',
  templateUrl: './upload-text.component.html',
  styleUrls: ['./upload-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadTextComponent {
  isUploading = false;
  csv: Row[] = [];

  standalone = this.standaloneService.standalone;
  hasValidKey = this.standaloneService.hasValidKey;
  pendingResourcesLimit = PENDING_RESOURCES_LIMIT;

  constructor(
    public modal: ModalRef,
    private sdk: SDKService,
    private uploadService: UploadService,
    private tracking: STFTrackingService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
    private standaloneService: StandaloneService,
  ) {}

  close(): void {
    this.modal.close({ cancel: true });
  }

  checkCsv(data: string[][]) {
    const csv = data.map((row) => ({
      title: row[0],
      body: row[1],
      format: row[2] as TextFormat,
      labels: parseCsvLabels(row[3]),
    }));
    if (csv.every((row) => FORMATS.includes(row.format) && !!row.labels)) {
      this.csv = csv as Row[];
      markForCheck(this.cdr);
    } else {
      this.toaster.error('upload.invalid-csv-labels');
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
          this.uploadService.bulkUpload(
            this.csv.map((row) => this.uploadService.uploadTextResource(row.title, row.body, row.format, row.labels)),
          ),
        ),
      )
      .subscribe(() => this.modal.close());
  }
}
