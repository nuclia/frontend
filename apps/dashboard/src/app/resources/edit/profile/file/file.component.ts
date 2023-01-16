import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { filter, map, Observable, Subject, switchMap, take, tap } from 'rxjs';
import { FIELD_TYPE, FileFieldData } from '@nuclia/core';
import { ActivatedRoute } from '@angular/router';
import { EditResourceService } from '../../edit-resource.service';

@Component({
  selector: 'app-resource-file',
  templateUrl: 'file.component.html',
  styleUrls: ['file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceFileComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput?: ElementRef;

  unsubscribeAll = new Subject<void>();
  isUploading = false;

  fieldId: Observable<string> = this.route.params.pipe(
    filter((params) => !!params.fieldId),
    map((params) => params.fieldId),
  );
  field: Observable<FileFieldData> = this.fieldId.pipe(
    switchMap((fieldId) => this.editResource.getField('files', fieldId)),
    map((fieldData) => fieldData as FileFieldData),
    tap(() => (this.isReady = true)),
  );
  filename: Observable<string> = this.field.pipe(map((field) => decodeURI(field.value?.file?.filename || '')));

  hasBaseDropZoneOver = false;
  newFile?: File;
  isReady = false;

  constructor(
    private route: ActivatedRoute,
    private editResource: EditResourceService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.editResource.setCurrentView('profile');
    this.editResource.setCurrentField(FIELD_TYPE.file);
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  fileOverBase(overBase: boolean) {
    if (!this.isUploading) {
      this.hasBaseDropZoneOver = overBase;
      this.cdr?.markForCheck();
    }
  }

  chooseFiles($event: MouseEvent) {
    if (!this.isUploading) {
      $event.preventDefault();
      this.fileInput?.nativeElement?.click();
    }
  }

  uploadFile(files: File[]) {
    if (files.length > 0 && !this.isUploading) {
      this.newFile = files[0];
    }
  }

  save() {
    if (this.newFile) {
      const file = this.newFile;
      this.isUploading = true;
      this.fieldId
        .pipe(
          take(1),
          switchMap((fieldId) => this.editResource.updateFile(fieldId, file)),
        )
        .subscribe(() => {
          this.isUploading = false;
          this.newFile = undefined;
          this.cdr.markForCheck();
        });
    }
  }

  cancel() {
    this.newFile = undefined;
  }

  deleteField() {
    this.fieldId
      .pipe(
        take(1),
        switchMap((fieldId) => this.editResource.confirmAndDelete(FIELD_TYPE.file, fieldId, this.route)),
      )
      .subscribe();
  }
}
