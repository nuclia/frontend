import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { forkJoin, map, shareReplay, switchMap, take } from 'rxjs';
import { DroppedFile, FeaturesService, SDKService, STFUtils } from '@flaps/core';
import { Classification, FileWithMetadata, ICreateResource } from '@nuclia/core';
import { UploadService } from '../upload.service';
import { StandaloneService } from '../../services';
import { getFilesGroupedByType } from '../upload.utils';
import { FormControl, Validators } from '@angular/forms';

const GENERAL_LABELSET = 'General';

@Component({
  selector: 'app-upload-files',
  templateUrl: './upload-files.component.html',
  styleUrls: ['./upload-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UploadFilesComponent {
  @Input() folderMode: boolean = false;
  @Output() close = new EventEmitter<{ cancel: boolean }>();
  @Output() upload = new EventEmitter<void>();

  files: { file: FileWithMetadata; aboveLimit: boolean }[] = [];
  selectedLabels: Classification[] = [];
  hasBaseDropZoneOver: boolean = false;
  limitsExceeded = false;
  maxFileSize = 0;
  maxMediaFileSize = 0;
  useFoldersAsLabels = false;
  automaticLanguageDetection = true;
  langCode = new FormControl<string | undefined>(undefined, {
    nonNullable: true,
    validators: [Validators.pattern(/^[a-z]{2}$/)],
  });

  /*
  betaProcessings = ['table', 'invoice', 'visual-llm'];
  processings = forkJoin([
    this.features.unstable.tableProcessing.pipe(take(1)),
    this.features.unstable.aiTableProcessing.pipe(take(1)),
    this.features.unstable.invoiceProcessing.pipe(take(1)),
    this.features.unstable.blanklineSplitter.pipe(take(1)),
    this.features.unstable.visualLLMProcessing.pipe(take(1)),
  ]).pipe(
    map(([table, aitable, invoice, blankline, visualLLM]) => {
      const processings: string[] = [];
      if (table) {
        processings.push('table');
      }
      if (aitable) {
        processings.push('aitable');
      }
      if (invoice) {
        processings.push('invoice');
      }
      if (blankline) {
        processings.push('blankline');
      }
      if (visualLLM) {
        processings.push('visual-llm');
      }
      return processings;
    }),
  );
  processing = 'none';
  */

  standalone = this.standaloneService.standalone;
  noLimit = this.standalone;
  hasValidKey = this.standaloneService.hasValidKey;
  isTrial = this.features.isTrial;
  extractStrategy?: string;

  get allowedFiles(): File[] {
    return this.noLimit
      ? this.files.map((item) => item.file)
      : this.files.filter((item) => !item.aboveLimit).map((item) => item.file);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private uploadService: UploadService,
    private sdk: SDKService,
    private standaloneService: StandaloneService,
    private features: FeaturesService,
  ) {
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      if (account.limits) {
        this.maxFileSize = account.limits.upload.upload_limit_max_non_media_file_size;
        this.maxMediaFileSize = account.limits.upload.upload_limit_max_media_file_size;
      }
    });
  }

  chooseFiles($event: any) {
    $event.preventDefault();
    if (!this.folderMode) {
      document.getElementById('upload-file-chooser')?.click();
    }
  }

  addFiles(filesOrFileList: File[] | FileList) {
    const { mediaFiles, nonMediaFiles } = getFilesGroupedByType(filesOrFileList);

    this.files = [
      ...this.files,
      ...mediaFiles.map((file) => ({
        file,
        aboveLimit: !this.noLimit && this.maxMediaFileSize !== -1 && file.size > this.maxMediaFileSize,
      })),
      ...nonMediaFiles.map((file) => ({
        file,
        aboveLimit: !this.noLimit && this.maxFileSize !== -1 && file.size > this.maxFileSize,
      })),
    ];
    this.checkLimits();
  }

  removeFile(file: File) {
    this.files = this.files.filter((item) => item.file !== file);
    this.checkLimits();
  }

  private checkLimits() {
    this.limitsExceeded = this.files.some((item) => item.aboveLimit);
    this.cdr.markForCheck();
  }

  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
    this.cdr.markForCheck();
  }

  onUpload() {
    const files = this.allowedFiles;
    this.uploadService.checkFileTypesAndConfirm(files).subscribe(() => this.startUpload(files));
  }

  startUpload(files: File[]) {
    if (files.length > 0) {
      this.upload.emit();
      let labelledFiles = this.setLabels(files);
      if (this.langCode) {
        labelledFiles.forEach((file) => {
          file.lang = this.langCode.getRawValue();
        });
      }
      if (this.extractStrategy) {
        labelledFiles.forEach((file) => {
          file.payload = { ...(file.payload || {}), processing_options: { extract_strategy: this.extractStrategy } };
        });
      }
      /*
      if (this.processing !== 'none') {
        labelledFiles.forEach((file) => {
          if ((this.processing !== 'blankline' || file.type === 'text/plain') && this.processing !== 'visual-llm') {
            file.contentType = `${file.type}+${this.processing}`;
          }
          if (this.processing === 'visual-llm') {
            // Temporary, at the moment the visual-llm processing is hard-coded in backend.
            // Specific processings will be managed in nucliadb soon.
            file.processing = 'vllm_extract';
          }
        });
      }
      */
      this.uploadService.uploadFilesAndManageCompletion(labelledFiles);
    } else {
      this.close.emit();
    }
  }

  private setLabels(files: FileWithMetadata[]): FileWithMetadata[] {
    if (this.useFoldersAsLabels) {
      files = files.map((file) => {
        // Dropped files don't have webkitRelativePath property
        const relativePath = 'relativePath' in file ? (file as DroppedFile).relativePath : file.webkitRelativePath;
        const parts = relativePath.split('/');
        let classifications: Classification[] = [];
        if (parts.length <= 1) {
          return file;
        } else if (parts.length === 2) {
          classifications = [
            {
              labelset: STFUtils.generateSlug(GENERAL_LABELSET),
              label: parts[0],
            },
          ];
        } else {
          const labelset = STFUtils.generateUniqueSlug(parts[0], []);
          classifications = parts.slice(1, -1).map((label) => ({ labelset, label }));
        }
        file.payload = {
          usermetadata: { classifications },
        };
        return file;
      });
    } else if (this.selectedLabels.length > 0) {
      const payload: ICreateResource = { usermetadata: { classifications: this.selectedLabels } };
      files = files.map((file) => {
        file.payload = payload;
        return file;
      });
    }
    return files;
  }

  cancel() {
    this.close.emit({ cancel: true });
  }
}
