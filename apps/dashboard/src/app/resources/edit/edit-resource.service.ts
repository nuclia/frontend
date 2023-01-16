import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';
import {
  Classification,
  deDuplicateList,
  FIELD_TYPE,
  FileField,
  IFieldData,
  KeywordSetField,
  LinkField,
  Resource,
  ResourceData,
  ResourceField,
  TextField,
  UserClassification,
} from '@nuclia/core';
import { SDKService } from '@flaps/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';

export type EditResourceView = 'profile' | 'classification';

@Injectable({
  providedIn: 'root',
})
export class EditResourceService {
  private _resource = new BehaviorSubject<Resource | null>(null);
  private _currentView = new BehaviorSubject<EditResourceView | null>(null);
  private _currentField = new BehaviorSubject<FIELD_TYPE | 'profile'>('profile');

  currentView: Observable<EditResourceView | null> = this._currentView.asObservable();
  currentField: Observable<FIELD_TYPE | 'profile'> = this._currentField.asObservable();
  resource: Observable<Resource | null> = this._resource.asObservable();
  fields: Observable<ResourceField[]> = this.resource.pipe(
    map((resource) =>
      Object.entries(resource?.data || {}).reduce((list, [type, dict]) => {
        return list.concat(
          Object.entries(dict).map(([fieldId, field]) => ({
            ...field,
            field_id: fieldId,
            field_type: type.slice(0, -1),
          })),
        );
      }, [] as ResourceField[]),
    ),
  );

  constructor(
    private sdk: SDKService,
    private router: Router,
    private toaster: SisToastService,
    private modalService: SisModalService,
    private translate: TranslateService,
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
      catchError(() => {
        this.toaster.error('generic.error.oops');
        this._resource.next(currentResource);
        return of(null);
      }),
      map(() => this.toaster.success('resource.save-successful')),
    );
  }

  setCurrentView(view: EditResourceView) {
    this._currentView.next(view);
  }

  setCurrentField(field: FIELD_TYPE | 'profile') {
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

  updateField(
    fieldType: FIELD_TYPE,
    fieldId: string,
    data: TextField | LinkField | FileField | KeywordSetField,
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
      currentResource
        .deleteField(fieldType, fieldId)
        .pipe(switchMap(() => currentResource.addField(fieldType, fieldId, data))),
      this.sdk.currentKb.pipe(
        take(1),
        tap((kb) => this._resource.next(kb.getResourceFromData({ ...currentResource, data: updatedData }))),
      ),
    ]).pipe(
      catchError(() => {
        this.toaster.error('generic.error.oops');
        this._resource.next(currentResource);
        return of(null);
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
      catchError(() => {
        this.toaster.error('generic.error.oops');
        this._resource.next(currentResource);
        return of(null);
      }),
      map(() => this.toaster.success('resource.field.delete-successful')),
    );
  }

  private getUpdatedData(
    fieldType: FIELD_TYPE,
    currentData: ResourceData,
    reduceCallback: (previous: any, current: [string, any]) => ResourceData,
  ): ResourceData {
    // Currently in our models, there are more FIELD_TYPEs than ResourceData keys, so we need the switch for typing reason
    let cleanedData: ResourceData;
    switch (fieldType) {
      case FIELD_TYPE.text:
      case FIELD_TYPE.file:
      case FIELD_TYPE.link:
      case FIELD_TYPE.keywordset:
        cleanedData = {
          ...currentData,
          [`${fieldType}s`]: Object.entries(currentData[`${fieldType}s`] || {}).reduce(reduceCallback, {} as any),
        };
        break;
      default:
        cleanedData = currentData;
        break;
    }
    return cleanedData;
  }
}
