import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Classification } from '@nuclia/core';
import { Observable, switchMap } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { IErrorMessages, ModalRef } from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { parseCsvLabels } from '../csv-parser';
import { StandaloneService } from '../../services';

interface Row {
  link: string;
  labels: Classification[];
}

@Component({
  selector: 'app-create-link',
  templateUrl: './create-link.component.html',
  styleUrls: ['./create-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLinkComponent {
  linkForm = new FormGroup({
    link: new FormControl<string>('', { validators: [Validators.pattern(/^http(s?):\/\//)] }),
    links: new FormControl<string>('', { validators: [Validators.pattern(/^([\r\n]*http(s?):\/\/.*?)+$/)] }),
    type: new FormControl<'one' | 'multiple' | 'csv'>('one'),
  });

  validationMessages: { [key: string]: IErrorMessages } = {
    link: {
      pattern: 'validation.url_required',
    } as IErrorMessages,
  };
  pending = false;
  selectedLabels: Classification[] = [];
  csv: Row[] = [];

  standalone = this.standaloneService.standalone;
  hasValidKey = this.standaloneService.hasValidKey;

  constructor(
    public modal: ModalRef,
    private uploadService: UploadService,
    private sdk: SDKService,
    private tracking: STFTrackingService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
    private standaloneService: StandaloneService,
  ) {}

  add() {
    if (this.linkForm.valid) {
      this.pending = true;
      this.cdr?.markForCheck();
      let obs: Observable<{ errors: number }>;
      if (this.linkForm.value.type === 'multiple') {
        this.tracking.logEvent('multiple_links_upload');
        const links: string[] = (this.linkForm.value.links || '')
          .split('\n')
          .map((link: string) => link.trim())
          .filter((link: string) => !!link);
        obs = this.uploadService.bulkUpload(
          links.map((link) => this.uploadService.createLinkResource(link, this.selectedLabels)),
        );
      } else if (this.linkForm.value.type === 'one') {
        this.tracking.logEvent('link_upload');
        obs = this.uploadService.bulkUpload([
          this.uploadService.createLinkResource(this.linkForm.value.link || '', this.selectedLabels),
        ]);
      } else {
        this.tracking.logEvent('link_upload_from_csv');
        const allLabels = this.csv.reduce((acc, curr) => acc.concat(curr.labels), [] as Classification[]);
        obs = this.uploadService
          .createMissingLabels(allLabels)
          .pipe(
            switchMap(() =>
              this.uploadService.bulkUpload(
                this.csv.map((link) => this.uploadService.createLinkResource(link.link, link.labels)),
              ),
            ),
          );
      }
      obs.subscribe((res) => {
        this.sdk.refreshCounter();
        if (res.errors === 0) {
          this.modal.close();
        } else {
          this.pending = false;
          this.cdr?.markForCheck();
        }
      });
    }
  }

  checkCsv(data: string[][]) {
    const csv = data.map((row) => ({ link: row[0], labels: parseCsvLabels(row[1]) }));
    if (csv.every((row) => !!row.labels)) {
      this.csv = csv as Row[];
      this.cdr?.markForCheck();
    } else {
      this.toaster.error('upload.invalid_csv');
    }
  }

  close(): void {
    this.modal.close({ cancel: true });
  }
}