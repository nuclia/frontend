import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FeaturesService, SDKService } from '@flaps/core';
import { Classification } from '@nuclia/core';
import { Observable, switchMap } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { IErrorMessages, ModalRef } from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../upload.service';
import { parseCsvLabels } from '../csv-parser';
import { StandaloneService } from '../../services';
import { PENDING_RESOURCES_LIMIT } from '../upload.utils';

interface Row {
  link: string;
  labels: Classification[];
  css_selector?: string;
  xpath?: string;
}

type UploadOption = 'one' | 'multiple' | 'csv';

@Component({
  selector: 'app-create-link',
  templateUrl: './create-link.component.html',
  styleUrls: ['./create-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CreateLinkComponent {
  linkForm = new FormGroup({
    link: new FormControl<string>('', { nonNullable: true, validators: [Validators.pattern(/^http(s?):\/\//)] }),
    links: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.pattern(/^(([\r\n]*http(s?):\/\/.*?)|\n)+$/)],
    }),
    linkTo: new FormControl<'web' | 'file'>('web', { nonNullable: true }),
    type: new FormControl<UploadOption>('one', { nonNullable: true }),
    css_selector: new FormControl<string | null>(null),
    xpath: new FormControl<string | null>(null),
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
  pendingResourcesLimit = PENDING_RESOURCES_LIMIT;
  extractConfigEnabled = this.features.unstable.extractConfig;
  extractStrategy?: string;
  updateOptionsExpander = 0;

  get invalid() {
    return (
      (this.linkForm.value.type === 'csv' && this.csv.length === 0) ||
      (['one', 'multiple'].includes(this.linkForm.value.type || '') && this.linkForm.invalid)
    );
  }

  constructor(
    public modal: ModalRef,
    private uploadService: UploadService,
    private sdk: SDKService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
    private standaloneService: StandaloneService,
    private features: FeaturesService,
  ) {}

  add() {
    if (this.linkForm.valid) {
      this.pending = true;
      this.cdr.markForCheck();
      const formValue = this.linkForm.getRawValue();
      const isCloudFile = formValue.linkTo === 'file';
      let obs: Observable<{ errors: number }>;
      switch (formValue.type) {
        case 'multiple':
          const links: string[] = formValue.links
            .split('\n')
            .map((link: string) => link.trim())
            .filter((link: string) => !!link);
          obs = this.uploadService.bulkUpload(
            links.map((link) =>
              this.getResourceCreationObs(
                isCloudFile,
                link,
                this.selectedLabels,
                formValue.css_selector,
                formValue.xpath,
                this.extractStrategy,
              ),
            ),
          );
          break;
        case 'one':
          obs = this.uploadService.bulkUpload([
            this.getResourceCreationObs(
              isCloudFile,
              formValue.link,
              this.selectedLabels,
              formValue.css_selector,
              formValue.xpath,
              this.extractStrategy,
            ),
          ]);
          break;
        case 'csv':
          const allLabels = this.csv.reduce((acc, curr) => acc.concat(curr.labels), [] as Classification[]);
          obs = this.uploadService
            .createMissingLabels(allLabels)
            .pipe(
              switchMap(() =>
                this.uploadService.bulkUpload(
                  this.csv.map((row) =>
                    this.getResourceCreationObs(isCloudFile, row.link, row.labels, row.css_selector, row.xpath),
                  ),
                ),
              ),
            );
          break;
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
    const csv = data.map((row) => ({
      link: row[0],
      labels: parseCsvLabels(row[1]),
      css_selector: row[2],
      xpath: row[3],
    }));
    if (csv.every((row) => !!row.labels)) {
      this.csv = csv as Row[];
      this.cdr?.markForCheck();
    } else {
      this.toaster.error('upload.invalid-csv-labels');
    }
  }

  close(): void {
    this.modal.close({ cancel: true });
  }

  private getResourceCreationObs(
    isCloudFile: boolean,
    link: string,
    labels: Classification[],
    css_selector?: string | null,
    xpath?: string | null,
    extract_strategy?: string,
  ): Observable<{ uuid: string }> {
    return isCloudFile
      ? this.uploadService.createCloudFileResource(link, labels, extract_strategy)
      : this.uploadService.createLinkResource(
          link,
          labels,
          css_selector,
          xpath,
          undefined,
          undefined,
          undefined,
          extract_strategy,
        );
  }
}
