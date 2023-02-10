import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Classification } from '@nuclia/core';
import { Observable, of, switchMap, take } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { CSVSpecs, parseCSVLabels, readCSV } from '../utils';

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
  csv: [string, Classification[]][] = [];
  specs = CSVSpecs;

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
        obs = this.sdk.currentKb.pipe(
          take(1),
          switchMap((kb) =>
            links.reduce(
              (acc, curr) =>
                acc.pipe(
                  switchMap(() => kb.createLinkResource({ uri: curr }, { classifications: this.selectedLabels })),
                ),
              of({ uuid: '' }),
            ),
          ),
        );
      } else if (this.linkForm.value.type === 'one') {
        this.tracking.logEvent('link_upload');
        obs = this.sdk.currentKb.pipe(
          take(1),
          switchMap((kb) =>
            kb.createLinkResource({ uri: this.linkForm.value.link || '' }, { classifications: this.selectedLabels }),
          ),
        );
      } else {
        this.tracking.logEvent('link_upload_from_csv');
        const allLabels = this.csv.reduce((acc, curr) => acc.concat(curr[1]), [] as Classification[]);
        obs = this.uploadService.createMissingLabels(allLabels).pipe(
          switchMap(() => this.sdk.currentKb.pipe(take(1))),
          switchMap((kb) =>
            this.csv.reduce(
              (acc, curr) =>
                acc.pipe(switchMap(() => kb.createLinkResource({ uri: curr[0] }, { classifications: curr[1] }))),
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

  readCSV(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      readCSV(file).subscribe((csv) => {
        const isValid = csv.every((row) => row.length === 2 && !!parseCSVLabels(row[1]));
        if (isValid) {
          this.csv = csv.map((row) => [row[0], parseCSVLabels(row[1])!]);
          this.cdr?.markForCheck();
        } else {
          this.toaster.error('upload.invalid_csv');
        }
      });
    }
  }

  close(): void {
    this.dialogRef.close({ cancel: true });
  }
}
