import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SDKService } from '@flaps/core';
import { CloudLink, FIELD_TYPE, FileFieldData, Resource } from '@nuclia/core';
import { BehaviorSubject, combineLatest, filter, forkJoin, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { delay, shareReplay, takeUntil } from 'rxjs/operators';
import { EditResourceService } from '../edit-resource.service';
import { JsonValidator } from '../../../validators';
import { ActivatedRoute } from '@angular/router';
import { ResourceNavigationService } from '../resource-navigation.service';

type Thumbnail = { uri: string; blob: SafeUrl };

@Component({
  templateUrl: 'profile.component.html',
  styleUrls: ['../common-page-layout.scss', 'profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceProfileComponent implements OnInit {
  @ViewChild('thumbnailFileInput') thumbnailFileInput?: ElementRef;

  unsubscribeAll = new Subject<void>();
  resource: Observable<Resource> = this.editResource.resource.pipe(
    filter((resource) => !!resource),
    map((resource) => resource as Resource),
    tap((resource: Resource) => {
      this.currentValue = resource;
      this.updateForm(resource);
    }),
    shareReplay(1),
    takeUntil(this.unsubscribeAll),
  );
  currentValue?: Resource;
  form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    summary: new FormControl<string>('', { nonNullable: true }),
    origin: new FormGroup({
      collaborators: new FormControl<string>('', { nonNullable: true }),
      url: new FormControl<string>('', { nonNullable: true }),
      filename: new FormControl<string>('', { nonNullable: true }),
      created: new FormControl<string>('', { nonNullable: true }),
      modified: new FormControl<string>('', { nonNullable: true }),
      related: new FormControl<string>('', { nonNullable: true }),
    }),
    extra: new FormControl<string>('', {
      nonNullable: true,
      validators: [JsonValidator()],
    }),
  });

  thumbnailsToBeDeleted = new BehaviorSubject<string[]>([]);
  thumbnails: Observable<Thumbnail[]> = combineLatest([
    this.thumbnailsToBeDeleted,
    this.resource.pipe(
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
    ),
  ]).pipe(map(([toBeDeleted, thumbnails]) => thumbnails.filter((thumbnail) => !toBeDeleted.includes(thumbnail.uri))));

  hintValues = this.resource.pipe(
    map((res) => ({
      RESOURCE: this.sdk.nuclia.rest.getFullUrl(res.path),
      DATA: JSON.stringify(this.getValue()),
    })),
  );
  hasBaseDropZoneOver = false;

  isFormReady = false;
  isSaving = false;
  extraMetadata: any;
  editExtraMetadata = false;
  selectedThumbnail: string | undefined;
  newThumbnail: string | undefined;

  constructor(
    private editResource: EditResourceService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private resourceNavigation: ResourceNavigationService,
  ) {
    this.resourceNavigation.currentRoute = this.route;
  }

  ngOnInit() {
    this.editResource.setCurrentView('resource');
    this.editResource.setCurrentField('resource');
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateForm(data: Resource): void {
    this.form.patchValue({
      title: data.title,
      summary: data.summary,
      origin: {
        collaborators: (data.origin?.collaborators || []).join(', '),
        url: data.origin?.url || '',
        filename: data.origin?.filename || '',
        created: data.origin?.created || '',
        modified: data.origin?.modified || '',
        related: (data.origin?.related || []).join('\n'),
      },
      extra: JSON.stringify(data.extra?.metadata, null, 2) || '',
    });
    this.selectedThumbnail = data.thumbnail;
    this.extraMetadata = data.extra?.metadata;
    this.isFormReady = true;
    this.cdr?.detectChanges();
  }

  save() {
    this.isSaving = true;
    const data: Partial<Resource> = this.getValue();
    if (!this.newThumbnail) {
      data.thumbnail = this.selectedThumbnail;
    }

    const request: Observable<void | null> = this.newThumbnail
      ? this.saveNewThumbnailAndPartialResource(data)
      : this.editResource.savePartialResource(data);

    request.pipe(switchMap(() => this.deleteOldThumbnails())).subscribe(() => {
      this.form.markAsPristine();
      this.thumbnailsToBeDeleted.next([]);
      this.newThumbnail = undefined;
      this.extraMetadata = data.extra?.metadata;
      this.editExtraMetadata = false;
      this.isSaving = false;
      this.cdr.markForCheck();
    });
  }

  cancel() {
    if (this.currentValue) {
      this.updateForm(this.currentValue);
      this.newThumbnail = undefined;
      this.thumbnailsToBeDeleted.next([]);
      this.form.markAsPristine();
      this.cdr.markForCheck();
    }
  }

  getValue(): Partial<Resource> {
    const value = this.form.getRawValue();
    return this.currentValue
      ? {
          title: value.title,
          summary: value.summary,
          origin: {
            ...this.currentValue.origin,
            collaborators: value.origin.collaborators.split(',').map((s) => s.trim()),
            url: value.origin.url,
            filename: value.origin.filename,
            created: value.origin.created || undefined,
            modified: value.origin.modified || undefined,
            related: value.origin.related.split('\n').map((s) => s.trim()),
          },
          extra: value.extra ? { metadata: JSON.parse(value.extra) } : undefined,
        }
      : {};
  }

  chooseFiles($event: MouseEvent) {
    if (!this.newThumbnail) {
      $event.preventDefault();
      this.thumbnailFileInput?.nativeElement?.click();
    }
  }

  uploadThumbnail(files: File[]) {
    if (files.length > 0 && !this.newThumbnail) {
      this.newThumbnail = URL.createObjectURL(files[0]);
      this.selectedThumbnail = this.newThumbnail;
    }
  }

  fileOverBase(overBase: boolean) {
    if (!this.newThumbnail) {
      this.hasBaseDropZoneOver = overBase;
      this.cdr?.markForCheck();
    }
  }

  trackByUri(index: number, thumbnail: Thumbnail) {
    return thumbnail.uri;
  }

  selectThumbnail(thumbnail: string | undefined) {
    this.selectedThumbnail = thumbnail;
  }

  markThumbnailForDeletion(thumbnail: string | undefined) {
    if (thumbnail === this.newThumbnail) {
      this.newThumbnail = undefined;
      if (this.currentValue?.thumbnail) {
        this.selectedThumbnail = this.currentValue.thumbnail;
      }
    } else if (thumbnail) {
      this.thumbnailsToBeDeleted.next(this.thumbnailsToBeDeleted.value.concat([thumbnail]));
    }
  }

  get thumbnailChanged(): boolean {
    return (
      !!this.newThumbnail ||
      this.selectedThumbnail !== this.currentValue?.thumbnail ||
      this.thumbnailsToBeDeleted.value.length > 0
    );
  }

  private getThumbnailsAndImages(resource: Resource): CloudLink[] {
    // Thumbnail uploaded by user
    const thumbnailFiles = resource
      .getFields<FileFieldData>(['files'])
      .filter((fileField) => fileField.value?.file?.content_type?.startsWith('image') && fileField.value?.file?.uri)
      .map((fileField) => fileField.value?.file as CloudLink);
    const extractedFileThumbnailUrl = thumbnailFiles.map((cloudLink) =>
      (cloudLink.uri || '').replace('/field', '/extracted/file_thumbnail'),
    );
    // thumbnail generated by the backend, excluding the ones generated on the thumbnail image uploaded by the user
    const extractedThumbnails = resource
      .getThumbnails()
      .filter((cloudLink) => !!cloudLink.uri && !extractedFileThumbnailUrl.includes(cloudLink.uri));
    return thumbnailFiles.concat(extractedThumbnails);
  }

  /**
   *  When adding a new thumbnail, we need to save in several steps:
   *   - first we upload the new thumbnail as a file field
   *   - then we save the rest of the form if there were some changes made
   *   - and we load the updated resource to find the backend URL of the new thumbnail,
   *   - so finally we can save this backend url as the new resource thumbnail
   */
  private saveNewThumbnailAndPartialResource(data: Partial<Resource>) {
    if (this.currentValue && this.thumbnailFileInput) {
      const filename = this.thumbnailFileInput.nativeElement.files[0]?.name;
      return this.currentValue.batchUpload(this.thumbnailFileInput.nativeElement.files).pipe(
        filter((status) => status.completed),
        switchMap(() => (!this.form.pristine ? this.editResource.savePartialResource(data, false) : of(null))),
        delay(1000), // wait a bit so the new thumbnail can be found in resource data after loading
        switchMap(() => this.editResource.loadResource(this.currentValue!.id)),
        switchMap((resource) => {
          const thumbnails = this.getThumbnailsAndImages(resource);
          const selectedThumbnail = thumbnails.find((thumbnail) => thumbnail.filename === encodeURIComponent(filename));
          return selectedThumbnail
            ? this.editResource.savePartialResource({ thumbnail: selectedThumbnail.uri })
            : of(null);
        }),
      );
    } else {
      return of(null);
    }
  }

  private deleteOldThumbnails(): Observable<null> {
    const resource = this.currentValue;
    const thumbnailToDelete = this.thumbnailsToBeDeleted.value;
    if (!resource || thumbnailToDelete.length === 0) {
      return of(null);
    }
    const deletionRequests = thumbnailToDelete.map((thumbnail) => {
      const fieldUrl = thumbnail.split('/download')[0];
      const fieldId = fieldUrl.split(`${resource.uuid}/file/`)[1];
      return resource.deleteField(FIELD_TYPE.file, fieldId, true);
    });
    return forkJoin(deletionRequests).pipe(
      delay(500), // wait a bit so the old thumbnails are properly removed from the resource reloading the thumbnails
      switchMap(() => this.editResource.loadResource(this.currentValue!.id)),
      map(() => null),
    );
  }
}
