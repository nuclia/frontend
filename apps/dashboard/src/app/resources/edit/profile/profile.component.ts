import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SDKService } from '@flaps/core';
import { CloudLink, FileFieldData, Resource } from '@nuclia/core';
import { filter, forkJoin, map, merge, Observable, Subject, switchMap, tap, timer } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { takeUntil } from 'rxjs/operators';
import { EditResourceService } from '../edit-resource.service';

type Thumbnail = { uri: string; blob: SafeUrl };

@Component({
  selector: 'app-resource-profile',
  templateUrl: 'profile.component.html',
  styleUrls: ['profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceProfileComponent implements OnInit {
  @ViewChild('thumbnailFileInput') thumbnailFileInput?: ElementRef;

  unsubscribeAll = new Subject<void>();
  refresh = new Subject<boolean>();
  resource: Observable<Resource> = this.editResource.resource.pipe(
    filter((resource) => !!resource),
    map((resource) => resource as Resource),
    tap((resource: Resource) => {
      this.currentValue = resource;
      this.updateForm(resource);
    }),
    takeUntil(this.unsubscribeAll),
  );
  currentValue?: Resource;
  form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    authors: new FormControl<string>('', { nonNullable: true }),
    summary: new FormControl<string>('', { nonNullable: true }),
    thumbnail: new FormControl<string>('', { nonNullable: true }),
  });
  thumbnails: Observable<Thumbnail[]> = this.resource.pipe(
    map((res) => this.getThumbnailsAndImages(res)),
    switchMap((thumbnails) =>
      forkJoin(
        thumbnails.map((thumbnail) =>
          this.sdk.nuclia.rest.getObjectURL(thumbnail.uri!).pipe(
            map((url) => ({
              uri: thumbnail.uri as string,
              blob: this.sanitizer.bypassSecurityTrustUrl(url),
            })),
          ),
        ),
      ),
    ),
  );

  hintValues = this.resource.pipe(
    map((res) => ({
      RESOURCE: this.sdk.nuclia.rest.getFullUrl(res.path),
      DATA: JSON.stringify(this.getValue()),
    })),
  );
  hasBaseDropZoneOver = false;

  stopThumbnailUploadStatus = merge(this.unsubscribeAll, this.refresh);
  isUploading = false;

  constructor(
    private editResource: EditResourceService,
    private sdk: SDKService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
  ) {
    this.form.disable();
  }

  ngOnInit() {
    this.editResource.setCurrentView('profile');
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateForm(data: Resource): void {
    this.form.patchValue({
      title: data.title,
      summary: data.summary,
      authors: (data.origin?.colaborators || []).join(', '),
      thumbnail: data.thumbnail,
    });
    this.form.enable();
    this.cdr?.markForCheck();
  }

  save() {
    const data = this.getValue();
    this.editResource.save(data).subscribe();
  }

  cancel() {
    if (this.currentValue) {
      this.updateForm(this.currentValue);
      this.form.markAsPristine();
    }
  }

  getValue(): Partial<Resource> {
    return this.currentValue
      ? {
          title: this.form.value.title,
          summary: this.form.value.summary,
          thumbnail: this.form.value.thumbnail,
          origin: {
            ...this.currentValue.origin,
            colaborators: (this.form.value.authors as string).split(',').map((s) => s.trim()),
          },
        }
      : {};
  }

  chooseFiles($event: MouseEvent) {
    if (!this.isUploading) {
      $event.preventDefault();
      this.thumbnailFileInput?.nativeElement?.click();
    }
  }

  uploadThumbnail(files: File[]) {
    if (files.length > 0 && !this.isUploading) {
      this.isUploading = true;
      this.currentValue
        ?.batchUpload(files)
        .pipe(
          filter((status) => status.completed),
          switchMap(() => timer(500)),
          takeUntil(this.stopThumbnailUploadStatus),
        )
        .subscribe(() => {
          this.refresh.next(true);
          this.isUploading = false;
        });
    }
  }

  fileOverBase(overBase: boolean) {
    if (!this.isUploading) {
      this.hasBaseDropZoneOver = overBase;
      this.cdr?.markForCheck();
    }
  }

  trackByUri(index: number, thumbnail: Thumbnail) {
    return thumbnail.uri;
  }

  private getThumbnailsAndImages(resource: Resource): CloudLink[] {
    return resource
      .getFields<FileFieldData>(['files'])
      .filter((fileField) => fileField.value?.file?.content_type?.startsWith('image'))
      .map((fileField) => fileField.value?.file as CloudLink)
      .concat(resource.getThumbnails());
  }
}
