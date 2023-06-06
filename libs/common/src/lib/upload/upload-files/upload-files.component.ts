import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { filter, map, take } from 'rxjs';
import { DroppedFile, SDKService, StateService, STFTrackingService, STFUtils } from '@flaps/core';
import { Account, Classification, FileWithMetadata, ICreateResource } from '@nuclia/core';
import { FILES_TO_IGNORE, PATTERNS_TO_IGNORE, UploadService } from '../upload.service';
import * as mime from 'mime';
import { StandaloneService } from '../../services';

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

  standalone = this.standaloneService.standalone;
  noLimit = this.standalone;
  hasValidKey = this.standaloneService.hasValidKey;

  get allowedFiles(): File[] {
    return this.noLimit
      ? this.files.map((item) => item.file)
      : this.files.filter((item) => !item.aboveLimit).map((item) => item.file);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private uploadService: UploadService,
    private tracking: STFTrackingService,
    private stateService: StateService,
    private sdk: SDKService,
    private standaloneService: StandaloneService,
  ) {
    this.stateService.account
      .pipe(
        filter((account) => !!account),
        map((account) => account as Account),
        take(1),
      )
      .subscribe((account) => {
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
    const files = Array.from(filesOrFileList)
      .filter(
        (file) =>
          !FILES_TO_IGNORE.includes(file.name) && !PATTERNS_TO_IGNORE.some((pattern) => file.name.match(pattern)),
      )
      .map((file) => {
        // Some file types (like .mkv) are not recognized by some browsers
        return file.type ? file : new File([file], file.name, { type: (mime as any).getType(file.name) });
      });
    const mediaFiles = this.getFilesByType(files, true);
    const nonMediaFiles = this.getFilesByType(files, false);

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

  getFilesByType(files: File[], mediaFile: boolean): File[] {
    return files.filter((file) => {
      const type = file.type?.split('/')[0];
      const isMediaFile = type === 'audio' || type === 'video' || type === 'image';
      return mediaFile ? isMediaFile : !isMediaFile;
    });
  }

  startUpload() {
    const files = this.allowedFiles;
    if (files.length > 0) {
      this.upload.emit();
      const labelledFiles = this.setLabels(files);
      this.uploadService.uploadFiles(labelledFiles);
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
