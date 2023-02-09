import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { filter, take } from 'rxjs';
import { DroppedFile, StateService, STFTrackingService, STFUtils } from '@flaps/core';
import { Classification, FileWithMetadata, ICreateResource } from '@nuclia/core';
import { FILES_TO_IGNORE, UploadService } from '../upload.service';

const GENERAL_LABELSET = 'General';

@Component({
  selector: 'app-upload-files',
  templateUrl: './upload-files.component.html',
  styleUrls: ['../_upload-dialog.scss', './upload-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFilesComponent {
  @Input() folderMode: boolean = false;
  @Output() close = new EventEmitter<{ cancel: boolean }>();
  @Output() upload = new EventEmitter<void>();

  files: FileWithMetadata[] = [];
  selectedLabels: Classification[] = [];
  hasBaseDropZoneOver: boolean = false;
  limitsExceeded = false;
  maxFileSize = 0;
  maxMediaFileSize = 0;
  useFoldersAsLabels = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private uploadService: UploadService,
    private tracking: STFTrackingService,
    private stateService: StateService,
  ) {
    this.stateService.account
      .pipe(
        filter((account) => !!account),
        take(1),
      )
      .subscribe((account) => {
        this.maxFileSize = account!.limits.upload.upload_limit_max_non_media_file_size;
        this.maxMediaFileSize = account!.limits.upload.upload_limit_max_media_file_size;
      });
  }

  chooseFiles($event: any) {
    $event.preventDefault();
    if (!this.folderMode) {
      document.getElementById('upload-file-chooser')?.click();
    }
  }

  addFiles(files: File[] | FileList) {
    this.files = [...this.files, ...Array.from(files).filter((file) => !FILES_TO_IGNORE.includes(file.name))];
    this.updateFiles();
  }

  removeFile(file: File) {
    this.files = this.files.filter((item) => item !== file);
    this.updateFiles();
  }

  private updateFiles() {
    this.limitsExceeded = this.files.length > this.getAllowedFiles().length;
    this.cdr?.markForCheck();
  }

  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
    this.cdr.markForCheck();
  }

  getFilesByType(files: File[], withAudio: boolean): File[] {
    return files.filter((file) => {
      let hasAudio;
      if (file.type) {
        const type = file.type.split('/')[0];
        hasAudio = type === 'audio' || type === 'video';
      } else {
        const extension = file.name.split('.').pop();
        hasAudio =
          !!extension &&
          ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'mkv', 'avi', 'mov', 'mp4', 'mpeg', 'mpg', 'm4v'].includes(
            extension,
          );
      }
      return withAudio ? hasAudio : !hasAudio;
    });
  }

  startUpload() {
    const files = this.getAllowedFiles();
    if (files.length > 0) {
      this.upload.emit();
      const labelledFiles = this.setLabels(files);
      this.uploadService.uploadFiles(labelledFiles);
      this.tracking.logEvent(this.folderMode ? 'folder_upload' : 'file_upload');
    } else {
      this.close.emit();
    }
  }

  getAllowedFiles() {
    const mediaFiles = this.getFilesByType(this.files, true);
    const nonMediaFiles = this.getFilesByType(this.files, false);
    return [
      ...nonMediaFiles.filter((file) => file.size <= this.maxFileSize),
      ...mediaFiles.filter((file) => file.size <= this.maxMediaFileSize),
    ];
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
