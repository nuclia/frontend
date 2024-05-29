import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { catchError, shareReplay, switchMap, take } from 'rxjs/operators';
import { EventList, NUAClient, ResourceProperties } from '@nuclia/core';

export interface Activity {
  resourceId: Observable<string>;
  timestamp: string;
  userId: Observable<string>;
}

@Injectable({
  providedIn: 'root',
})
export class NuaActivityService {
  private _resourceNames: { [key: string]: Observable<string> } = {};
  private _userNames: { [key: string]: Observable<string> } = {};

  private _activityLogs: BehaviorSubject<Activity[]> = new BehaviorSubject<Activity[]>([]);
  private _hasMore: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private _nextPage?: number;
  private _nuaClient?: { accountId: string; clientId: string; zoneSlug: string };

  get activityLogs() {
    return this._activityLogs.asObservable();
  }

  get hasMore() {
    return this._hasMore.asObservable();
  }

  constructor(private sdk: SDKService) {}

  loadActivity(accountId: string, client: NUAClient): Observable<EventList> {
    this._nuaClient = { accountId: accountId, clientId: client.client_id, zoneSlug: client.zone };
    return this.sdk.nuclia.db.getNUAActivity(accountId, client.client_id, client.zone).pipe(
      tap((data) => {
        this._activityLogs.next(this.mapEventsToActivityLogs(data, accountId));
        this._hasMore.next(!data.pagination.last);
        this._nextPage = data.pagination.page + 1;
      }),
    );
  }

  loadMore() {
    if (!this._nuaClient || !this._nextPage) {
      return;
    }
    const accountId = this._nuaClient.accountId;
    this.sdk.nuclia.db
      .getNUAActivity(accountId, this._nuaClient.clientId, this._nuaClient.zoneSlug, this._nextPage)
      .subscribe((data) => {
        this._activityLogs.next(this._activityLogs.value.concat(this.mapEventsToActivityLogs(data, accountId)));
        this._hasMore.next(!data.pagination.last);
        this._nextPage = data.pagination.page + 1;
      });
  }

  private getUserName(userId: string, accountSlug: string): Observable<string> {
    if (userId === 'anonymous') {
      return of(userId);
    }
    if (!this._userNames[userId]) {
      this._userNames[userId] = this.sdk.nuclia.db.getAccountUser(accountSlug, userId).pipe(
        map((user) => user.name || userId),
        catchError(() => of(userId)), // In case the user no longer exists
        shareReplay(1),
      );
    }
    return this._userNames[userId];
  }

  private getResource(id: string): Observable<string> {
    if (!this._resourceNames[id]) {
      this._resourceNames[id] = this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) =>
          kb.getResource(id).pipe(
            map((resource) => resource.title || id),
            catchError(() => of(id)), // In case the resource no longer exists
          ),
        ),
        shareReplay(1),
      );
    }
    return this._resourceNames[id];
  }

  private mapEventsToActivityLogs(data: EventList, accountSlug: string) {
    return data.events.map((event) => ({
      resourceId: this.sdk.isKbLoaded ? this.getResource(event['rid']) : of(event['rid']),
      timestamp: event['time'],
      userId: this.getUserName(event['userid'], accountSlug),
    }));
  }
}
