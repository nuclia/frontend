import { Injectable } from '@angular/core';
import { SortOption } from '@nuclia/core';
import { BehaviorSubject, combineLatest, filter, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ResourceNavigationModel {
  resourceIdList: string[];
  page: number;
  hasMore: boolean;
  pageSize: number;
  sort: SortOption;
  query: string;
  titleOnly: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ResourceNavigationService {
  private _navigationData = new BehaviorSubject<ResourceNavigationModel | null>(null);
  private _currentResourceId = new BehaviorSubject<string | null>(null);

  set navigationData(data: ResourceNavigationModel) {
    this._navigationData.next(data);
  }
  set currentResourceId(id: string) {
    this._currentResourceId.next(id);
  }

  hasData: Observable<boolean> = combineLatest([this._navigationData, this._currentResourceId]).pipe(
    map(([data, resourceId]) => !!data && !!resourceId),
  );

  isFirstResource: Observable<boolean> = combineLatest([this._navigationData, this._currentResourceId]).pipe(
    filter(([data, resourceId]) => !!data && !!resourceId),
    map(
      ([data, resourceId]) =>
        (data as ResourceNavigationModel).resourceIdList.findIndex((id) => resourceId === id) === 0,
    ),
  );

  isLastResource: Observable<boolean> = combineLatest([this._navigationData, this._currentResourceId]).pipe(
    filter(([data, resourceId]) => !!data && !!resourceId),
    map(([data, resourceId]) => {
      const resourceIdList = (data as ResourceNavigationModel).resourceIdList;
      return resourceIdList.findIndex((id) => resourceId === id) === resourceIdList.length - 1 && !data?.hasMore;
    }),
  );
}
