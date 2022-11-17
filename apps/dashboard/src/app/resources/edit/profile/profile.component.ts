import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';
import { CloudLink, FileFieldData, Classification, Resource } from '@nuclia/core';
import { filter, forkJoin, map, merge, Observable, switchMap, tap, timer } from 'rxjs';
import { BaseEditComponent } from '../base-edit.component';
import { SisToastService } from '@nuclia/sistema';
import { takeUntil } from 'rxjs/operators';

type Thumbnail = { uri: string; blob: SafeUrl };

@Component({
  selector: 'app-resource-profile',
  templateUrl: 'profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceProfileComponent extends BaseEditComponent {
  @ViewChild('thumbnailFileInput') thumbnailFileInput?: ElementRef;

  form = this.formBuilder.group({
    title: ['', [Validators.required]],
    authors: [''],
    summary: [''],
    thumbnail: [''],
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
  currentLabels: Classification[] = [];
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
    protected route: ActivatedRoute,
    protected sdk: SDKService,
    protected formBuilder: UntypedFormBuilder,
    protected toaster: SisToastService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
  ) {
    super(route, sdk, formBuilder, toaster);
  }

  updateForm(data: Resource): void {
    this.form.patchValue({
      title: data.title,
      summary: data.summary,
      authors: (data.origin?.colaborators || []).join(', '),
      thumbnail: data.thumbnail,
    });
    this.currentLabels = this.currentValue?.getClassifications() || [];
    this.cdr?.markForCheck();
  }

  updateLabels(labels: Classification[]) {
    this.currentLabels = labels;
    this.form.markAsDirty();
    this.cdr?.markForCheck();
  }

  getValue(): Partial<Resource> {
    return this.currentValue
      ? {
          title: this.form.value.title,
          summary: this.form.value.summary,
          thumbnail: this.form.value.thumbnail,
          usermetadata: { ...this.currentValue.usermetadata, classifications: this.currentLabels },
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
