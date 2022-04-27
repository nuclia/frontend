import { SelectionModel } from '@angular/cdk/collections';
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { STFTrackingService } from '@flaps/auth';
import { STFUtils } from '@flaps/core';
import { FileWithMetadata, ICreateResource, LabelValue } from '@nuclia/core';
import { UploadService } from '../upload.service';

@Component({
  selector: 'app-upload-files',
  templateUrl: './upload-files.component.html',
  styleUrls: ['./upload-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFilesComponent {
  @Input() folderMode: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() upload = new EventEmitter<void>();

  files: FileWithMetadata[] = [];
  filesWithAudio: FileWithMetadata[] = [];
  filesWithoutAudio: FileWithMetadata[] = [];
  selectedLabels: LabelValue[] = [];
  hasBaseDropZoneOver: boolean = false;
  langSelect = new FormControl('');
  langMultiSelect = new FormControl('');
  languageList = STFUtils.supportedAudioLanguages();
  pendingLangs = 0;
  fileSelection = new SelectionModel<FileWithMetadata>(true, []);

  constructor(
    private cdr: ChangeDetectorRef,
    private uploadService: UploadService,
    private tracking: STFTrackingService,
  ) {}

  chooseFiles($event: any) {
    $event.preventDefault();
    if (!this.folderMode) {
      document.getElementById('upload-file-chooser')?.click();
    }
  }

  addFiles(files: File[] | FileList) {
    this.files = [...this.files, ...Array.from(files)];
    this.filesWithAudio = this.getFilesByType(this.files, true);
    this.filesWithoutAudio = this.getFilesByType(this.files, false);
    this.pendingLangs = this.getPendingLangs();
    this.cdr?.markForCheck();
  }

  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
    this.cdr.markForCheck();
  }

  getFilesByType(files: File[], withAudio: boolean): File[] {
    return files.filter((file) => {
      let hasAudio = false;
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

  getPendingLangs(): number {
    return this.filesWithAudio.filter((f) => !f.lang).length;
  }

  startUpload() {
    this.upload.emit();
    const payload: ICreateResource = {};
    if (this.selectedLabels.length > 0) {
      payload.usermetadata = { classifications: this.selectedLabels };
    }
    this.uploadService.uploadFiles(this.files, payload);
    this.tracking.logEvent(this.folderMode ? 'folder_upload' : 'file_upload');
  }

  onSelectLanguageMulti(event: Event) {
    const lang = (<HTMLInputElement>event.target).value;
    this.langMultiSelect.patchValue('', { emitEvent: false });
    this.setLanguage(this.filesWithAudio.length === 1 ? this.filesWithAudio : this.fileSelection.selected, lang);
    this.fileSelection.clear();
    this.cdr.markForCheck();
  }

  setLanguage(files: FileWithMetadata[], lang: string) {
    files.forEach((file) => {
      file.lang = lang;
    });
    this.pendingLangs = this.getPendingLangs();
    this.cdr.markForCheck();
  }
}
