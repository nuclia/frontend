import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { map, take } from 'rxjs';
import { DroppedFile, FeaturesService, SDKService, STFTrackingService, STFUtils } from '@flaps/core';
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
  processings = this.features.specificProcessings.pipe(
    map((yes) => (yes ? ['none', 'table', 'aitable', 'invoice'] : ['none', 'table'])),
  );
  processing = 'none';

  standalone = this.standaloneService.standalone;
  noLimit = this.standalone;
  hasValidKey = this.standaloneService.hasValidKey;
  isTrial = this.sdk.currentAccount.pipe(map((account) => account.type === 'stash-trial'));

  get allowedFiles(): File[] {
    return this.noLimit
      ? this.files.map((item) => item.file)
      : this.files.filter((item) => !item.aboveLimit).map((item) => item.file);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private uploadService: UploadService,
    private tracking: STFTrackingService,
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
      if (this.processing !== 'none') {
        labelledFiles.forEach((file) => (file.contentType = `${file.type}+${this.processing}`));
      }
      this.uploadService.uploadFilesAndManageCompletion(labelledFiles);
      this.tracking.logEvent(this.folderMode ? 'folder_upload' : 'file_upload');
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
