import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import {
  Classification,
  CloudLink,
  FIELD_TYPE,
  FieldId,
  FileFieldData,
  getDataKeyFromFieldType,
  IFieldData,
  LinkField,
  longToShortFieldType,
  Paragraph,
  Resource,
  ResourceData,
  ResourceField,
  TextField,
  UserClassification,
} from '@nuclia/core';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  addEntitiesToGroups,
  EditResourceView,
  EntityGroup,
  getClassificationsPayload,
  getCustomEntities,
  Thumbnail,
} from './edit-resource.helpers';
import { generatedEntitiesColor, getNerFamilyTitle } from '../../entities/model';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class EditResourceService {
  private _resource = new BehaviorSubject<Resource | null>(null);
  private _currentView = new BehaviorSubject<EditResourceView | null>(null);
  private _currentField = new BehaviorSubject<FieldId | 'resource'>('resource');

  currentView: Observable<EditResourceView | null> = this._currentView.asObservable();
  currentField: Observable<FieldId | 'resource'> = this._currentField.asObservable();
  resource: Observable<Resource | null> = this._resource.asObservable();
  currentFieldData = this.resource.pipe(
    switchMap((resource) =>
      this.currentField.pipe(
        map((field) =>
          field === 'resource'
            ? undefined
            : resource?.getFieldData(`${field.field_type}s` as keyof ResourceData, field.field_id),
        ),
      ),
    ),
  );
  fields: Observable<ResourceField[]> = this.resource.pipe(
    map((resource) =>
      Object.entries(resource?.data || {}).reduce((list, [type, dict]) => {
        return list.concat(
          Object.entries(dict).map(([fieldId, field]) => ({
            ...field,
            field_id: fieldId,
            field_type: type.slice(0, -1), // remove the `s` from resource.data property
          })),
        );
      }, [] as ResourceField[]),
    ),
  );
  kbUrl: Observable<string> = combineLatest([this.sdk.currentAccount, this.sdk.currentKb]).pipe(
    map(([account, kb]) => this.navigation.getKbUrl(account.slug, kb.slug!)),
  );
  isAdminOrContrib = this.features.isKbAdminOrContrib;

  constructor(
    private sdk: SDKService,
    private router: Router,
    private toaster: SisToastService,
    private modalService: SisModalService,
    private translate: TranslateService,
    private navigation: NavigationService,
    private sanitizer: DomSanitizer,
    private features: FeaturesService,
  ) {}

  loadResource(resourceId: string): Observable<Resource> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getFullResource(resourceId)),
      tap((resource) => this._resource.next(resource)),
    );
  }

  loadResourceEntities(): Observable<EntityGroup[]> {
    return combineLatest([
      this.resource.pipe(
        filter((resource) => !!resource),
        map((resource) => resource as Resource),
      ),
      this.sdk.currentKb.pipe(switchMap((kb) => kb.getEntities())),
    ]).pipe(
      map(([resource, allEntities]) => {
        const allGroups: EntityGroup[] = Object.entries(allEntities)
          .map(([groupId, group]) => {
            const generatedColor = generatedEntitiesColor[groupId];
            return {
              id: groupId,
              title: getNerFamilyTitle(groupId, group, this.translate),
              color: group.color || generatedColor,
              entities: [],
              custom: group.custom,
            };
          })
          .sort((a, b) => a.title.localeCompare(b.title));

        addEntitiesToGroups(allGroups, resource.getNamedEntities());
        addEntitiesToGroups(allGroups, getCustomEntities(resource));
        allGroups.forEach((group) => group.entities.sort((a, b) => a.localeCompare(b)));
        return allGroups;
      }),
    );
  }

  getField(fieldType: keyof ResourceData, fieldId: string): Observable<IFieldData> {
    return this.resource.pipe(
      filter((resource) => !!resource),
      map((resource) => resource as Resource),
      map((resource) => resource.data[fieldType]?.[fieldId] || {}),
    );
  }

  savePartialResource(partialResource: Partial<Resource>, showSuccessToast = true): Observable<void | null> {
    const currentResource = this._resource.value;
    if (!currentResource) {
      return of(null);
    }
    return forkJoin([
      currentResource.modify(partialResource),
      this.sdk.currentKb.pipe(
        take(1),
        tap((kb) => this._resource.next(kb.getResourceFromData({ ...currentResource, ...partialResource }))),
      ),
    ]).pipe(
      catchError((error) => {
        this.toaster.error('generic.error.oops');
        return throwError(() => error);
      }),
      map(() => {
        if (showSuccessToast) {
          this.toaster.success('resource.save-successful');
        }
      }),
    );
  }

  setCurrentView(view: EditResourceView) {
    this._currentView.next(view);
  }

  setCurrentField(field: FieldId | 'resource') {
    this._currentField.next(field);
  }

  reset() {
    this._resource.next(null);
    this._currentView.next(null);
    this._currentField.next('resource');
  }

  getClassificationsPayload(labels: Classification[]): UserClassification[] {
    if (!this._resource.value) {
      return [];
    }
    return getClassificationsPayload(this._resource.value, labels);
  }

  addField(fieldType: FIELD_TYPE, fieldId: string, fieldData: TextField | LinkField): Observable<void | null> {
    const currentResource = this._resource.value;
    if (!currentResource) {
      return of(null);
    }

    const dataKey = getDataKeyFromFieldType(fieldType);
    const resourceData: ResourceData = dataKey
      ? {
          ...currentResource.data,
          [dataKey]: {
            ...currentResource.data[dataKey],
            [fieldId]: {
              value: fieldData,
            },
          },
        }
      : currentResource.data;
    return this.setField(
      currentResource,
      fieldType,
      fieldId,
      fieldData,
      resourceData,
      'resource.field.addition-successful',
    );
  }

  addFile(fieldId: string, file: File): Observable<void | null> {
    const currentResource = this._resource.value;
    if (!currentResource) {
      return of(null);
    }

    const dataKey = getDataKeyFromFieldType(FIELD_TYPE.file);
    const updatedData: ResourceData = dataKey
      ? {
          ...currentResource.data,
          [dataKey]: {
            ...currentResource.data[dataKey],
            [fieldId]: this.getFileFieldData(file),
          },
        }
      : currentResource.data;
    return currentResource.upload(fieldId, file).pipe(
      switchMap(() => this.sdk.currentKb.pipe(take(1))),
      tap((kb) => this._resource.next(kb.getResourceFromData({ ...currentResource, data: updatedData }))),
      catchError((error) => {
        this.toaster.error('generic.error.oops');
        return throwError(() => error);
      }),
      map(() => this.toaster.success('resource.field.update-successful')),
    );
  }

  updateField(fieldType: FIELD_TYPE, fieldId: string, fieldData: TextField | LinkField): Observable<void | null> {
    const currentResource = this._resource.value;
    if (!currentResource) {
      return of(null);
    }

    const resourceData: ResourceData = this.getUpdatedData(fieldType, currentResource.data, (fields, [id, field]) => {
      if (id !== fieldId) {
        fields[id] = field;
      } else {
        fields[id] = {
          value: fieldData,
        };
      }
      return fields;
    });
    return this.setField(
      currentResource,
      fieldType,
      fieldId,
      fieldData,
      resourceData,
      'resource.field.update-successful',
    );
  }

  private setField(
    currentResource: Resource,
    fieldType: FIELD_TYPE,
    fieldId: string,
    fieldData: TextField | LinkField,
    resourceData: ResourceData,
    successMessage: string,
  ) {
    return forkJoin([
      currentResource.setField(fieldType, fieldId, fieldData),
      this.sdk.currentKb.pipe(
        take(1),
        tap((kb) => this._resource.next(kb.getResourceFromData({ ...currentResource, data: resourceData }))),
      ),
    ]).pipe(
      catchError((error) => {
        this.toaster.error('generic.error.oops');
        return throwError(() => error);
      }),
      map(() => this.toaster.success(successMessage)),
    );
  }

  updateFile(fieldId: string, file: File): Observable<void | null> {
    const currentResource = this._resource.value;
    if (!currentResource) {
      return of(null);
    }

    const updatedData: ResourceData = this.getUpdatedData(
      FIELD_TYPE.file,
      currentResource.data,
      (fields, [id, field]) => {
        if (id !== fieldId) {
          fields[id] = field;
        } else {
          fields[id] = this.getFileFieldData(file);
        }
        return fields;
      },
    );
    return currentResource.deleteField(FIELD_TYPE.file, fieldId).pipe(
      switchMap(() => currentResource.upload(fieldId, file)),
      switchMap(() => this.sdk.currentKb.pipe(take(1))),
      tap((kb) => this._resource.next(kb.getResourceFromData({ ...currentResource, data: updatedData }))),
      catchError((error) => {
        this.toaster.error('generic.error.oops');
        return throwError(() => error);
      }),
      map(() => this.toaster.success('resource.field.update-successful')),
    );
  }

  confirmAndDelete(fieldType: FIELD_TYPE, fieldId: string, route: ActivatedRoute): Observable<void | null> {
    return this.modalService
      .openConfirm({
        title: this.translate.instant('resource.field.delete-confirm-title', {
          type: this.translate.instant(`resource.field-${fieldType}`),
        }),
        confirmLabel: 'generic.delete',
        description: this.translate.instant('resource.field.delete-confirm-description', {
          type: this.translate.instant(`resource.field-${fieldType}`),
        }),
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.deleteField(fieldType, fieldId)),
        tap((done) => {
          if (done !== null) {
            this.router.navigate(['../../resource'], { relativeTo: route });
          }
        }),
      );
  }

  getParagraphId(field: FieldId, paragraph: Paragraph): string {
    const resource = this._resource.getValue();
    const typeAbbreviation = longToShortFieldType(field.field_type);
    return resource ? `${resource.id}/${typeAbbreviation}/${field.field_id}/${paragraph.start}-${paragraph.end}` : '';
  }

  private deleteField(fieldType: FIELD_TYPE, fieldId: string): Observable<void | null> {
    const currentResource = this._resource.value;
    if (!currentResource) {
      return of(null);
    }

    const updatedData: ResourceData = this.getUpdatedData(fieldType, currentResource.data, (fields, [id, field]) => {
      if (id !== fieldId) {
        fields[id] = field;
      }
      return fields;
    });
    return forkJoin([
      currentResource.deleteField(fieldType, fieldId),
      this.sdk.currentKb.pipe(
        take(1),
        tap((kb) => this._resource.next(kb.getResourceFromData({ ...currentResource, data: updatedData }))),
      ),
    ]).pipe(
      catchError((error) => {
        this.toaster.error('generic.error.oops');
        return throwError(() => error);
      }),
      map(() => this.toaster.success('resource.field.delete-successful')),
    );
  }

  private getUpdatedData(
    fieldType: FIELD_TYPE,
    currentData: ResourceData,
    reduceCallback: (previous: any, current: [string, any]) => ResourceData,
  ): ResourceData {
    const dataKey = getDataKeyFromFieldType(fieldType);
    return dataKey
      ? {
          ...currentData,
          [dataKey]: Object.entries(currentData[dataKey] || {}).reduce(reduceCallback, {} as any),
        }
      : currentData;
  }

  private getFileFieldData(file: File): FileFieldData {
    return {
      value: {
        file: {
          filename: file.name,
          content_type: file.type,
          size: file.size,
        },
      },
    };
  }

  getThumbnailsAndImages(resource: Resource): CloudLink[] {
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

  getThumbnails(links: CloudLink[]): Observable<Thumbnail[]> {
    return forkJoin(
      links.map((thumbnail) =>
        this.sdk.nuclia.rest.getObjectURL(thumbnail.uri!).pipe(
          map((url) => ({
            uri: thumbnail.uri as string,
            blob: this.sanitizer.bypassSecurityTrustUrl(url),
          })),
        ),
      ),
    );
  }
}
