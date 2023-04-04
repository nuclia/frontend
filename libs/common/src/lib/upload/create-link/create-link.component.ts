import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Classification } from '@nuclia/core';
import { Observable, of, switchMap } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { parseCsvLabels } from '../utils';

interface Row {
  link: string;
  labels: Classification[];
}

@Component({
  selector: 'app-create-link',
  templateUrl: './create-link.component.html',
  styleUrls: ['../_upload-dialog.scss', './create-link.component.scss'],
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

  constructor(
    public dialogRef: MatDialogRef<CreateLinkComponent>,
    private uploadService: UploadService,
    private sdk: SDKService,
    private tracking: STFTrackingService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  add() {
    if (this.linkForm.valid) {
      this.pending = true;
      this.cdr?.markForCheck();
      let obs: Observable<{ uuid: string }>;
      if (this.linkForm.value.type === 'multiple') {
        this.tracking.logEvent('multiple_links_upload');
        const links: string[] = (this.linkForm.value.links || '')
          .split('\n')
          .map((link: string) => link.trim())
          .filter((link: string) => !!link);
        obs = links.reduce(
          (acc, curr) => acc.pipe(switchMap(() => this.uploadService.createLinkResource(curr, this.selectedLabels))),
          of({ uuid: '' }),
        );
      } else if (this.linkForm.value.type === 'one') {
        this.tracking.logEvent('link_upload');
        obs = this.uploadService.createLinkResource(this.linkForm.value.link || '', this.selectedLabels);
      } else {
        this.tracking.logEvent('link_upload_from_csv');
        const allLabels = this.csv.reduce((acc, curr) => acc.concat(curr.labels), [] as Classification[]);
        obs = this.uploadService
          .createMissingLabels(allLabels)
          .pipe(
            switchMap(() =>
              this.csv.reduce(
                (acc, curr) => acc.pipe(switchMap(() => this.uploadService.createLinkResource(curr.link, curr.labels))),
                of({ uuid: '' }),
              ),
            ),
          );
      }
      obs.subscribe({
        next: () => {
          this.dialogRef.close();
          this.sdk.refreshCounter();
        },
        error: () => {
          this.pending = false;
          this.cdr?.markForCheck();
          this.toaster.error('link.create.error');
        },
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
    this.dialogRef.close({ cancel: true });
  }
}
