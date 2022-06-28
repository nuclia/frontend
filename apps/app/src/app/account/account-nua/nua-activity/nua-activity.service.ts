import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/auth';
import { map, Observable, of, tap } from 'rxjs';
import { catchError, shareReplay, switchMap, take } from 'rxjs/operators';
import { ResourceProperties } from '@nuclia/core';
import { UsersService } from '@flaps/core';

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

  constructor(private sdk: SDKService, private userService: UsersService) {}

  getActivity(accountSlug: string, clientId: string): Observable<Activity[]> {
    return this.sdk.nuclia.db.getNUAActivity(accountSlug, clientId).pipe(
      map((data) =>
        data.events.map((event) => ({
          resourceId: this.sdk.isKbLoaded ? this.getResource(event.rid) : of(event.rid),
          timestamp: event.time,
          userId: this.getUserName(event.userid, accountSlug),
        })),
      ),
    );
  }

  private getUserName(userId: string, accountSlug: string): Observable<string> {
    if (userId === 'anonymous') {
      return of(userId);
    }
    if (!this._userNames[userId]) {
      this._userNames[userId] = this.userService.getAccountUser(accountSlug, userId).pipe(
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
        tap((kb) => console.log(kb)),
        take(1),
        switchMap((kb) =>
          kb.getResource(id, [ResourceProperties.BASIC], []).pipe(
            map((resource) => resource.title || id),
            catchError(() => of(id)), // In case the resource no longer exists
          ),
        ),
        shareReplay(1),
      );
    }
    return this._resourceNames[id];
  }
}
