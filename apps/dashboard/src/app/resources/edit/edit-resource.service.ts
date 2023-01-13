import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Classification, deDuplicateList, FIELD_TYPE, Resource, ResourceField, UserClassification } from '@nuclia/core';
import { SDKService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';

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

  constructor(private sdk: SDKService, private toaster: SisToastService) {}

  loadResource(resourceId: string) {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.getResource(resourceId)),
      )
      .subscribe((resource) => this._resource.next(resource));
  }

  save(partialResource: Partial<Resource>): Observable<void | null> {
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
        this.toaster.error(error);
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
}
