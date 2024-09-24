import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FeaturesService, SDKService } from '@flaps/core';
import { FIELD_TYPE, Resource } from '@nuclia/core';
import { BehaviorSubject, combineLatest, filter, forkJoin, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { delay, shareReplay, take, takeUntil } from 'rxjs/operators';
import { EditResourceService } from '../edit-resource.service';
import { JsonValidator } from '../../../validators';
import { ActivatedRoute } from '@angular/router';
import { ResourceNavigationService } from '../resource-navigation.service';
import { Thumbnail } from '../edit-resource.helpers';

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
    slug: new FormControl<string>('', { nonNullable: true }),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    summary: new FormControl<string>('', { nonNullable: true }),
    hidden: new FormControl<boolean>(false, { nonNullable: true }),
    origin: new FormGroup({
      collaborators: new FormControl<string>('', { nonNullable: true }),
      url: new FormControl<string>('', { nonNullable: true }),
      filename: new FormControl<string>('', { nonNullable: true }),
      created: new FormControl<string>('', { nonNullable: true }),
      modified: new FormControl<string>('', { nonNullable: true }),
      related: new FormControl<string>('', { nonNullable: true }),
      path: new FormControl<string>('', { nonNullable: true }),
    }),
    extra: new FormControl<string>('', {
      nonNullable: true,
      validators: [JsonValidator()],
    }),
    security: new FormGroup({
      access_groups: new FormControl<string>('', { nonNullable: true }),
    }),
  });

  thumbnailsToBeDeleted = new BehaviorSubject<string[]>([]);
  thumbnails: Observable<Thumbnail[]> = combineLatest([
    this.thumbnailsToBeDeleted,
    this.resource.pipe(
      switchMap((res) => this.editResource.getThumbnails(this.editResource.getThumbnailsAndImages(res))),
    ),
  ]).pipe(map(([toBeDeleted, thumbnails]) => thumbnails.filter((thumbnail) => !toBeDeleted.includes(thumbnail.uri))));
  thumbnailsLoaded = this.thumbnails.pipe(
    delay(300),
    tap((thumbnails) => this.updateGeneralExpanderSize.next(thumbnails)),
  );
  updateGeneralExpanderSize = new Subject();

  hintValues = this.resource.pipe(
    map((res) => ({
      RESOURCE: this.sdk.nuclia.rest.getFullUrl(res.path),
      DATA: JSON.stringify(this.getValue()),
    })),
  );
  isTrial = this.features.isTrial;
  hasBaseDropZoneOver = false;
  hiddenResourcesEnabled = this.sdk.currentKb.pipe(map((kb) => !!kb.hidden_resources_enabled));

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
    private route: ActivatedRoute,
    private resourceNavigation: ResourceNavigationService,
    private features: FeaturesService,
  ) {
    this.resourceNavigation.currentRoute = this.route;
  }

  ngOnInit() {
    this.editResource.setCurrentView('resource');
    this.editResource.setCurrentField('resource');
    this.thumbnailsLoaded.pipe(takeUntil(this.unsubscribeAll)).subscribe();
    this.updateGeneralExpanderSize
      .pipe(
        tap(() => this.cdr.detectChanges()),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateForm(data: Resource): void {
    this.form.patchValue({
      slug: data.slug,
      title: data.title,
      summary: data.summary,
      hidden: data.hidden,
      origin: {
        collaborators: (data.origin?.collaborators || []).join(', '),
        url: data.origin?.url || '',
        filename: data.origin?.filename || '',
        created: data.origin?.created || '',
        modified: data.origin?.modified || '',
        related: (data.origin?.related || []).join('\n'),
        path: data.origin?.path || '',
      },
      extra: JSON.stringify(data.extra?.metadata, null, 2) || '',
      security: {
        access_groups: data.security?.access_groups.join('\n') || '',
      },
    });
    this.selectedThumbnail = data.thumbnail;
    this.extraMetadata = data.extra?.metadata;
    this.isFormReady = true;
    this.cdr?.detectChanges();
  }

  save() {
    this.isSaving = true;
    this.hiddenResourcesEnabled
      .pipe(
        take(1),
        switchMap((enabled) => {
          const data: Partial<Resource> = this.getValue(enabled);
          if (!this.newThumbnail) {
            data.thumbnail = this.selectedThumbnail;
          }

          const request: Observable<void | null> = this.newThumbnail
            ? this.saveNewThumbnailAndPartialResource(data)
            : this.editResource.savePartialResource(data);

          return request.pipe(
            switchMap(() => this.deleteOldThumbnails()),
            tap(() => {
              this.form.markAsPristine();
              this.thumbnailsToBeDeleted.next([]);
              this.newThumbnail = undefined;
              this.extraMetadata = data.extra?.metadata;
              this.editExtraMetadata = false;
              this.isSaving = false;
              this.cdr.markForCheck();
            }),
          );
        }),
      )
      .subscribe();
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

  getValue(hiddenResources = false): Partial<Resource> {
    const value = this.form.getRawValue();
    return this.currentValue
      ? {
          slug: value.slug,
          title: value.title,
          summary: value.summary,
          hidden: hiddenResources ? value.hidden : undefined,
          origin: {
            ...this.currentValue.origin,
            collaborators: value.origin.collaborators.split(',').map((s) => s.trim()),
            url: value.origin.url,
            filename: value.origin.filename,
            created: value.origin.created || undefined,
            modified: value.origin.modified || undefined,
            related: value.origin.related.split('\n').map((s) => s.trim()),
            path: value.origin.path || undefined,
          },
          extra: value.extra ? { metadata: JSON.parse(value.extra) } : undefined,
          security: value.security ? { access_groups: value.security.access_groups.split('\n') } : undefined,
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
          const thumbnails = this.editResource.getThumbnailsAndImages(resource);
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

  onResizingTextarea($event: DOMRect) {
    this.updateGeneralExpanderSize.next($event);
  }

  onToggleChange() {
    // TODO: Toggles do not properly set the form control to dirty
    this.form.markAsDirty();
    this.cdr.markForCheck();
  }
}
