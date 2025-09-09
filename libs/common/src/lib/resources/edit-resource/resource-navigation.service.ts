import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { deDuplicateList } from '@nuclia/core';
import { BehaviorSubject, combineLatest, filter, Observable, switchMap, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResourceListParams, searchResources } from '../resource-list/resource-list.model';

interface ResourceNavigationModel extends ResourceListParams {
  resourceIdList: string[];
  hasMore: boolean;
  isArag?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ResourceNavigationService {
  private router = inject(Router);
  private sdk = inject(SDKService);

  private _navigationData = new BehaviorSubject<ResourceNavigationModel | null>(null);
  private _currentResourceId = new BehaviorSubject<string | null>(null);
  private _currentRoute?: ActivatedRoute;
  private _loadingMore = false;

  set navigationData(data: ResourceNavigationModel) {
    this._navigationData.next(data);
  }
  set currentResourceId(id: string) {
    this._currentResourceId.next(id);
  }
  set currentRoute(route: ActivatedRoute) {
    this._currentRoute = route;
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

  goToPrevious() {
    const currentData = this._navigationData.value;
    const currentId = this._currentResourceId.value;
    if (currentData && currentId) {
      const previousIndex = currentData.resourceIdList.findIndex((id) => id === currentId) - 1;
      if (previousIndex > -1) {
        this.navigateToNextResource(currentData, previousIndex);
      }
    }
  }
  goToNext() {
    const currentData = this._navigationData.value;
    const currentId = this._currentResourceId.value;
    if (currentData && currentId) {
      const nextIndex = currentData.resourceIdList.findIndex((id) => id === currentId) + 1;

      // arriving to the end of the list, if there is more we load it so user can navigate till the end seamlessly
      if (nextIndex === currentData.resourceIdList.length - 2 && currentData.hasMore) {
        this.loadMoreResources();
      }
      if (nextIndex < currentData.resourceIdList.length) {
        this.navigateToNextResource(currentData, nextIndex);
      }
    }
  }

  private navigateToNextResource(currentData: ResourceNavigationModel, nextIndex: number) {
    const resourceId = currentData.resourceIdList[nextIndex];
    const snapshot = this._currentRoute?.snapshot;
    let newUrl = currentData.isArag
      ? location.pathname.replace(/\/sessions\/[a-z0-9]+\/edit/, `/sessions/${resourceId}/edit`)
      : location.pathname.replace(/\/resources\/[a-z0-9]+\/edit/, `/resources/${resourceId}/edit`);
    const lastPath = snapshot?.routeConfig?.path?.split('/')[0];
    if (lastPath && lastPath !== 'resource') {
      newUrl = `${newUrl.split(lastPath)[0]}${lastPath}`;
    }
    this.router.navigateByUrl(newUrl);
  }

  private loadMoreResources() {
    const currentData = this._navigationData?.value;
    if (currentData && currentData.hasMore && !this._loadingMore) {
      this._loadingMore = true;
      const newPageData = {
        ...currentData,
        page: currentData.page + 1,
      };
      this.sdk.currentKb
        .pipe(
          take(1),
          switchMap((kb) => searchResources(kb, newPageData)),
        )
        .subscribe((data) => {
          const hasMore = !!data.results.fulltext?.next_page;
          this.navigationData = {
            ...newPageData,
            hasMore,
            resourceIdList: deDuplicateList(
              newPageData.resourceIdList.concat(
                Object.values(data.results.resources || {}).map((resource) => resource.id),
              ),
            ),
          };
          this._loadingMore = false;
        });
    }
  }
}
