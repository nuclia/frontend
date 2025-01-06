import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getFilesGroupedByType, UploadModule } from '@flaps/common';
import { FeaturesService, FileUploadModule, SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { Observable, Subject, take } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ItemToUpload } from '../getting-started.models';
import { UploadListComponent } from '../upload-list/upload-list.component';

@Component({
  selector: 'app-getting-started-upload',
  imports: [
    CommonModule,
    TranslateModule,
    UploadModule,
    FileUploadModule,
    PaTextFieldModule,
    PaButtonModule,
    PaTooltipModule,
    ReactiveFormsModule,
    UploadListComponent,
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent implements OnInit, OnDestroy {
  @Output() uploadReady = new EventEmitter<{ ready: boolean; itemList: ItemToUpload[] }>();

  hasBaseDropZoneOver: boolean = false;
  account = this.sdk.currentAccount;
  isTrial: Observable<boolean> = this.features.isTrial;

  linkControl = new FormControl<string>('', {
    updateOn: 'blur',
    validators: [Validators.pattern(/^([\r\n]*http(s?):\/\/.*?)+$/)],
  });
  itemsToUpload: ItemToUpload[] = [];

  unsubscribeAll = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private toaster: SisToastService,
    private translate: TranslateService,
    private features: FeaturesService,
  ) {}

  ngOnInit() {
    this.linkControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribeAll))
      .subscribe((value) => this.addLinks(value));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
    this.cdr.markForCheck();
  }

  chooseFiles($event: any) {
    $event.preventDefault();
    document.getElementById('upload-file-chooser')?.click();
  }

  addFiles(filesOrFileList: File[] | FileList) {
    this.account.pipe(take(1)).subscribe((account) => {
      const { mediaFiles, nonMediaFiles } = getFilesGroupedByType(filesOrFileList);
      const maxFileSize = account.limits?.upload.upload_limit_max_non_media_file_size || -1;
      const maxMediaFileSize = account.limits?.upload.upload_limit_max_media_file_size || -1;
      const mediaFilesUnderLimit =
        maxMediaFileSize !== -1 ? mediaFiles.filter((file) => file.size <= maxMediaFileSize) : mediaFiles;
      const nonMediaFilesUnderLimit =
        maxFileSize !== -1 ? nonMediaFiles.filter((file) => file.size <= maxFileSize) : nonMediaFiles;

      let files = mediaFilesUnderLimit.concat(nonMediaFilesUnderLimit);
      // keep only the 5 smaller files
      const availableSpots = 5 - this.itemsToUpload.length;
      if (files.length > availableSpots) {
        files = files.sort((a, b) => a.size - b.size).slice(0, availableSpots);
        this.toaster.info(
          this.translate.instant('getting-started.upload.disclaimer.smallest-files-toast', {
            count: availableSpots,
            total: filesOrFileList.length,
          }),
        );
      }
      this.itemsToUpload = [
        ...this.itemsToUpload,
        ...files.map((file, index) => ({ id: `file${index}${file.name}`, title: file.name, file })),
      ];
      this.checkUploadReady();
    });
  }

  addLinks(value: string | null) {
    const links: string[] = (value || '')
      .split('\n')
      .map((link: string) => link.trim())
      .filter((link: string) => !!link && !this.itemsToUpload.find((item) => item.link === link));

    const availableSpots = 5 - this.itemsToUpload.length;
    let linkToUpload = [...links];
    if (links.length > availableSpots) {
      linkToUpload = links.slice(0, availableSpots);
      this.toaster.info(
        this.translate.instant('getting-started.upload.disclaimer.first-links-toast', {
          count: availableSpots,
          total: links.length,
        }),
      );
    }
    this.itemsToUpload = [
      ...this.itemsToUpload,
      ...linkToUpload.map((link, index) => ({ id: `link${index}${link}`, title: link, link })),
    ];
    this.cdr.markForCheck();
    this.checkUploadReady();
    if (this.itemsToUpload.length === 5) {
      this.linkControl.disable();
    }
  }

  removeItem(id: string) {
    this.itemsToUpload = this.itemsToUpload.filter((item) => item.id !== id);
    this.linkControl.enable();
    this.checkUploadReady();
  }

  private checkUploadReady() {
    this.uploadReady.emit({
      ready: this.itemsToUpload.length > 0 && this.itemsToUpload.length <= 5,
      itemList: this.itemsToUpload,
    });
  }
}
