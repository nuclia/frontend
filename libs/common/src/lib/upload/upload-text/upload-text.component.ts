import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { SDKService } from '@flaps/core';
import {
  markForCheck,
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Classification, TextFieldFormat, TextFormat } from '@nuclia/core';
import { InfoCardComponent, SisProgressModule, SisToastService } from '@nuclia/sistema';
import { switchMap, take } from 'rxjs';
import { StandaloneService } from '../../services';
import { parseCsvLabels } from '../csv-parser';
import { CsvSelectComponent } from '../csv-select/csv-select.component';
import { UploadService } from '../upload.service';
import { PENDING_RESOURCES_LIMIT } from '../upload.utils';

const FORMATS: Set<TextFormat> = new Set(['PLAIN', 'MARKDOWN', 'KEEP_MARKDOWN', 'HTML', 'RST']);

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
  imports: [
    PaModalModule,
    PaButtonModule,
    InfoCardComponent,
    CsvSelectComponent,
    PaTooltipModule,
    SisProgressModule,
    AsyncPipe,
    DecimalPipe,
    TranslatePipe,
  ],
})
export class UploadTextComponent {
  isUploading = false;
  csv: Row[] = [];

  standalone = this.standaloneService.standalone;
  hasValidKey = this.standaloneService.hasValidKey;
  pendingResourcesLimit = PENDING_RESOURCES_LIMIT;

  constructor(
    public modal: ModalRef,
    private uploadService: UploadService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
    private standaloneService: StandaloneService,
    private sdk: SDKService,
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
    if (csv.every((row) => FORMATS.has(row.format) && !!row.labels)) {
      this.csv = csv as Row[];
      markForCheck(this.cdr);
    } else {
      this.toaster.error('upload.invalid-csv-labels');
    }
  }

  upload() {
    this.isUploading = true;
    markForCheck(this.cdr);
    const allLabels = this.csv.reduce((acc, current) => acc.concat(current.labels), [] as Classification[]);
    this.uploadService
      .createMissingLabels(allLabels)
      .pipe(
        switchMap(() => this.sdk.currentKb.pipe(take(1))),
        switchMap((kb) =>
          this.uploadService.bulkUpload(
            this.csv.map((row) =>
              this.uploadService.uploadTextResource(kb, row.title, row.body, row.format, row.labels),
            ),
          ),
        ),
      )
      .subscribe(() => this.modal.close());
  }
}
