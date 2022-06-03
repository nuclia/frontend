import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Observable, of } from 'rxjs';
import { takeUntil, take, map, switchMap, concatMap, catchError, tap, shareReplay, filter } from 'rxjs/operators';
import { SDKService, StateService } from '@flaps/auth';
import { UsersService } from '@flaps/core';
import { ResourcePagination, ResourceProperties, EventType } from '@nuclia/core';

export interface ActivityEvent {
  resource: Observable<string>;
  date?: string;
  username: Observable<string>;
}

export type ActivityData = { 
  [type in EventType]?: { events: ActivityEvent[], pagination: ResourcePagination | null }
}

export const VISIBLE_TYPES = [EventType.PROCESSED, EventType.NEW, EventType.MODIFIED];

const RESULTS_PER_PAGE = 30;


@Injectable()
export class ActivityService implements OnDestroy {

  private _resources: { [key: string]: Observable<string> } = {};
  private _users: { [key: string]: Observable<string> } = {};
  private triggerLoad = new Subject<EventType>();
  private unsubscribeAll = new Subject<void>();

  private _activity = new BehaviorSubject<ActivityData>(
    VISIBLE_TYPES.reduce((acc, type) => {
      acc[type] = { events: [], pagination: null };
      return acc;
    }, {} as ActivityData)
  );

  activity = this._activity.asObservable();

  constructor(private sdk: SDKService, private users: UsersService, private stateService: StateService) {
    this.triggerLoad
      .pipe(
        concatMap((type) => {
          const { events, pagination } = this._activity.getValue()[type]!;
          const nextPage = typeof pagination?.page === 'number' ? pagination.page + 1 : 0;
          return this.getEvents(type, nextPage).pipe(
            map((res) => ({ events: [...events, ...res.events], pagination: res.pagination})),
            tap((res) => { 
              const activity = this._activity.getValue();
              activity[type] = res;
              this._activity.next(activity)
            })
          )
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  loadMoreEvents(type: EventType) {
    this.triggerLoad.next(type);
  }

  private getEvents(type: EventType, page: number) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => 
        kb.listActivity(type, page, RESULTS_PER_PAGE).pipe(
          map((res) => ({
            pagination: res.pagination,
            events: res.events.map((event) => ({
              resource: this.getResource(event.rid),
              date: event.time || undefined,
              username: event.userid ? this.getUser(event.userid) : of(''),
            }))
          })),
        )
      )
    )
  }

  private getUser(id: string) {
    if (!this._users[id]) {
      this._users[id] = this.stateService.account.pipe(
        filter((account) => !!account),
        take(1),
        switchMap((account) =>
          this.users.getAccountUser(account!.slug!, id).pipe(
            map((user) => user.name || ''),
            catchError(() => of(id)) // In case the user no longer exists
          )
        ),
        shareReplay(1)
      );
    }
    return this._users[id];
  }
  
  private getResource(id: string) {
    if (!this._resources[id]) {
      this._resources[id] = this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) =>
          kb.getResource(id, [ResourceProperties.BASIC], []).pipe(
            map((resource) => resource.title || ''),
            catchError(() => of(id)) // In case the resource no longer exists
          )
        ),
        shareReplay(1)
      );
    }
    return this._resources[id];
  }
}
