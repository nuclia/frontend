import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FeaturesService, SDKService } from '@flaps/core';
import { Classification, WritableKnowledgeBox } from '@nuclia/core';
import { catchError, Observable, switchMap, take } from 'rxjs';
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
  automaticLanguageDetection = true;
  langCode = new FormControl<string | undefined>(undefined, {
    nonNullable: true,
    validators: [Validators.pattern(/^[a-z]{2}$/)],
  });

  standalone = this.standaloneService.standalone;
  hasValidKey = this.standaloneService.hasValidKey;
  pendingResourcesLimit = PENDING_RESOURCES_LIMIT;
  extractConfigEnabled = this.features.authorized.extractConfig;
  splitConfigEnabled = this.features.authorized.splitConfig;
  extractStrategy?: string;
  splitStrategy?: string;
  updateExisting = false;
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
          obs = this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) =>
              this.uploadService.bulkUpload(
                links.map((link) =>
                  this.getResourceCreationObs(
                    kb,
                    isCloudFile,
                    link,
                    this.selectedLabels,
                    formValue.css_selector,
                    formValue.xpath,
                    this.extractStrategy,
                    this.splitStrategy,
                    this.langCode.value,
                    this.updateExisting,
                  ),
                ),
              ),
            ),
          );
          break;
        case 'one':
          obs = this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) =>
              this.uploadService.bulkUpload([
                this.getResourceCreationObs(
                  kb,
                  isCloudFile,
                  formValue.link,
                  this.selectedLabels,
                  formValue.css_selector,
                  formValue.xpath,
                  this.extractStrategy,
                  this.splitStrategy,
                  this.langCode.value,
                  this.updateExisting,
                ),
              ]),
            ),
          );
          break;
        case 'csv':
          const allLabels = this.csv.reduce((acc, curr) => acc.concat(curr.labels), [] as Classification[]);
          obs = this.uploadService.createMissingLabels(allLabels).pipe(
            switchMap(() => this.sdk.currentKb.pipe(take(1))),
            switchMap((kb) =>
              this.uploadService.bulkUpload(
                this.csv.map((row) =>
                  this.getResourceCreationObs(
                    kb,
                    isCloudFile,
                    row.link,
                    row.labels,
                    row.css_selector,
                    row.xpath,
                    this.extractStrategy,
                    this.splitStrategy,
                    this.langCode.value,
                    this.updateExisting,
                  ),
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
    kb: WritableKnowledgeBox,
    isCloudFile: boolean,
    link: string,
    labels: Classification[],
    css_selector?: string | null,
    xpath?: string | null,
    extract_strategy?: string,
    split_strategy?: string,
    language?: string,
    updateExisting?: boolean,
  ) {
    const linkField = {
      uri: link,
      css_selector: css_selector || null,
      xpath: xpath || null,
      extract_strategy,
      split_strategy,
      language,
    };
    return isCloudFile
      ? this.uploadService.createCloudFileResource(kb, link, labels, extract_strategy, split_strategy, language).pipe(
          catchError((error) => {
            if (error?.status === 409 && updateExisting) {
              return this.uploadService.updateCloudFileResource(
                kb,
                link,
                labels,
                extract_strategy,
                split_strategy,
                language,
              );
            }
            throw error;
          }),
        )
      : this.uploadService.createLinkResource(kb, link, labels, linkField).pipe(
          catchError((error) => {
            if (error?.status === 409 && updateExisting) {
              return this.uploadService.updateLinkResource(kb, link, labels, linkField);
            }
            throw error;
          }),
        );
  }
}
