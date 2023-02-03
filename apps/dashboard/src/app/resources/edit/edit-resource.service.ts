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
  deDuplicateList,
  FIELD_TYPE,
  FieldId,
  FileFieldData,
  getDataKeyFromFieldType,
  IFieldData,
  KeywordSetField,
  LinkField,
  longToShortFieldType,
  Paragraph,
  Resource,
  ResourceData,
  ResourceField,
  TextField,
  UserClassification,
  UserFieldMetadata,
} from '@nuclia/core';
import { SDKService } from '@flaps/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  addEntitiesToGroups,
  EditResourceView,
  EntityGroup,
  getFieldMetadataForAnnotations,
  getFieldMetadataForClassifications,
  ParagraphWithTextAndAnnotations,
  ParagraphWithTextAndClassifications,
} from './edit-resource.helpers';
import { generatedEntitiesColor } from '../../entities/model';
import { NavigationService } from '../../services/navigation.service';

@Injectable({
  providedIn: 'root',
})
export class EditResourceService {
  private _resource = new BehaviorSubject<Resource | null>(null);
  private _currentView = new BehaviorSubject<EditResourceView | null>(null);
  private _currentField = new BehaviorSubject<FieldId | 'profile'>('profile');

  currentView: Observable<EditResourceView | null> = this._currentView.asObservable();
  currentField: Observable<FieldId | 'profile'> = this._currentField.asObservable();
  resource: Observable<Resource | null> = this._resource.asObservable();
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
  kbUrl: Observable<string> = this.sdk.currentKb.pipe(map((kb) => this.navigation.getKbUrl(kb.account, kb.slug!)));

  constructor(
    private sdk: SDKService,
    private router: Router,
    private toaster: SisToastService,
    private modalService: SisModalService,
    private translate: TranslateService,
    private navigation: NavigationService,
  ) {}

  private _loadResource(resourceId: string): Observable<Resource> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getResource(resourceId)),
      tap((resource) => this._resource.next(resource)),
    );
  }

  loadResource(resourceId: string) {
    this._loadResource(resourceId).subscribe();
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
            const title = group.title || (generatedColor ? `resource.entities.${groupId.toLowerCase()}` : groupId);
            return {
              id: groupId,
              title: this.translate.instant(title),
              color: group.color || generatedColor,
              entities: [],
              custom: group.custom,
            };
          })
          .sort((a, b) => a.title.localeCompare(b.title));

        addEntitiesToGroups(allGroups, resource.getNamedEntities());
        addEntitiesToGroups(allGroups, resource.getAnnotatedEntities());
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

  savePartialResource(partialResource: Partial<Resource>): Observable<void | null> {
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
      map(() => this.toaster.success('resource.save-successful')),
    );
  }

  saveClassifications(field: FieldId, paragraphs: ParagraphWithTextAndClassifications[]): Observable<void | null> {
    const currentResource = this._resource.value;
    if (!currentResource) {
      return of(null);
    }
    const fieldMetadata: UserFieldMetadata[] = getFieldMetadataForClassifications(
      field,
      paragraphs,
      currentResource.fieldmetadata || [],
    );
    return this.savePartialResource({ fieldmetadata: fieldMetadata });
  }

  saveAnnotations(field: FieldId, paragraphs: ParagraphWithTextAndAnnotations[]): Observable<void | null> {
    const currentResource = this._resource.value;
    if (!currentResource) {
      return of(null);
    }
    const fieldMetadata: UserFieldMetadata[] = getFieldMetadataForAnnotations(
      field,
      paragraphs,
      currentResource.fieldmetadata || [],
    );
    return this.savePartialResource({ fieldmetadata: fieldMetadata });
  }

  setCurrentView(view: EditResourceView) {
    this._currentView.next(view);
  }

  setCurrentField(field: FieldId | 'profile') {
    this._currentField.next(field);
  }

  reset() {
    this._resource.next(null);
    this._currentView.next(null);
    this._currentField.next('profile');
  }

  getClassificationsPayload(labels: Classification[]): UserClassification[] {
    if (!this._resource.value) {
      return [];
    }
    const extracted = deDuplicateList(
      (this._resource.value.computedmetadata?.field_classifications || []).reduce((acc, field) => {
        return acc.concat(field.classifications || []);
      }, [] as Classification[]),
    );
    const userClassifications = labels.filter(
      (label) => !extracted.some((l) => l.labelset === label.labelset && l.label === label.label),
    );
    const cancellations = extracted
      .filter((label) => !labels.some((l) => l.labelset === label.labelset && l.label === label.label))
      .map((label) => ({ ...label, cancelled_by_user: true }));
    return [...userClassifications, ...cancellations];
  }

  addField(
    fieldType: FIELD_TYPE,
    fieldId: string,
    data: TextField | LinkField | KeywordSetField,
  ): Observable<void | null> {
    const currentResource = this._resource.value;
    if (!currentResource) {
      return of(null);
    }

    const dataKey = getDataKeyFromFieldType(fieldType);
    const updatedData: ResourceData = dataKey
      ? {
          ...currentResource.data,
          [dataKey]: {
            ...currentResource.data[dataKey],
            [fieldId]: {
              value: data,
            },
          },
        }
      : currentResource.data;
    return forkJoin([
      currentResource.addField(fieldType, fieldId, data),
      this.sdk.currentKb.pipe(
        take(1),
        tap((kb) => this._resource.next(kb.getResourceFromData({ ...currentResource, data: updatedData }))),
      ),
    ]).pipe(
      catchError((error) => {
        this.toaster.error('generic.error.oops');
        return throwError(() => error);
      }),
      map(() => this.toaster.success('resource.field.addition-successful')),
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

  updateField(
    fieldType: FIELD_TYPE,
    fieldId: string,
    data: TextField | LinkField | KeywordSetField,
  ): Observable<void | null> {
    const currentResource = this._resource.value;
    if (!currentResource) {
      return of(null);
    }

    const updatedData: ResourceData = this.getUpdatedData(fieldType, currentResource.data, (fields, [id, field]) => {
      if (id !== fieldId) {
        fields[id] = field;
      } else {
        fields[id] = {
          value: data,
        };
      }
      return fields;
    });
    return forkJoin([
      currentResource.updateField(fieldType, fieldId, data),
      this.sdk.currentKb.pipe(
        take(1),
        tap((kb) => this._resource.next(kb.getResourceFromData({ ...currentResource, data: updatedData }))),
      ),
    ]).pipe(
      catchError((error) => {
        this.toaster.error('generic.error.oops');
        return throwError(() => error);
      }),
      map(() => this.toaster.success('resource.field.update-successful')),
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
            this.router.navigate(['../../profile'], { relativeTo: route });
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
}
