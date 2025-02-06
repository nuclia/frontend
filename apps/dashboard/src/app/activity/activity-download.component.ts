import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import {
  concatMap,
  filter,
  from,
  map,
  mergeMap,
  Observable,
  of,
  repeat,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { SDKService, UserService } from '@flaps/core';
import { EventType } from '@nuclia/core';
import { format } from 'date-fns';
import { SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { LogEntry } from './log.models';

type Tab = 'resources' | 'searches';
type ActivityTab = EventType;

const baseColumns = ['id', 'date', 'user_id', 'client_type'];
const resourceColumns = [...baseColumns, 'resource_id'];
const searchColumns = [...baseColumns, 'question', 'resources_count', 'filter'];
const chatColumns = [
  ...searchColumns,
  'rephrased_question',
  'answer',
  'feedback_good',
  'feedback_comment',
  'feedback',
  'model',
  'rag_strategies_names',
  'status',
];

@Component({
  selector: 'app-activity-download',
  templateUrl: './activity-download.component.html',
  styleUrls: ['./activity-download.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ActivityDownloadComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();
  activityTabs: { [tab in Tab]: ActivityTab[] } = {
    searches: [EventType.CHAT, EventType.SEARCH],
    resources: [EventType.PROCESSED, EventType.NEW, EventType.MODIFIED],
  };
  downloads: {
    [key: string]: {
      status: 'pending' | 'completed';
      requestId?: string;
      url?: string;
      rows?: LogEntry[];
    };
  } = {};
  watchList = new Subject<{ key: string; requestId: string }>();
  email = this.user.userPrefs.pipe(map((user) => user?.email || ''));
  selectedTab: Tab = 'resources';
  selectedActivityTab: ActivityTab = this.activityTabs[this.selectedTab][0];

  activity = [...this.activityTabs.searches, ...this.activityTabs.resources].reduce(
    (acc, tab) => {
      acc[tab] = this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) => kb.activityMonitor.getMonthsWithActivity(tab).pipe(map((res) => res.downloads))),
        map((res) =>
          res.sort((a, b) => a.localeCompare(b) * -1).map((month) => ({ month, formatted: this.formatDate(month) })),
        ),
        shareReplay(),
      );

      return acc;
    },
    {} as { [key in ActivityTab]: Observable<{ month: string; formatted: string }[]> },
  );

  constructor(
    private sdk: SDKService,
    private user: UserService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private translate: TranslateService,
  ) {
    this.watchList
      .pipe(
        mergeMap(({ key, requestId }) =>
          this.sdk.currentKb.pipe(
            concatMap((kb) =>
              of(null).pipe(
                repeat({ delay: 5000 }),
                takeUntil(this.unsubscribeAll),
                switchMap(() => kb.activityMonitor.getDownloadStatus(requestId)),
                filter((data) => {
                  if (data.download_url) {
                    this.downloads[key].status = 'completed';
                    this.downloads[key].url = data.download_url;
                    this.cdr?.markForCheck();
                    return true;
                  }
                  return false;
                }),
                take(1),
              ),
            ),
            concatMap(() => {
              const url = this.downloads[key].url;
              if (!url) {
                return of(null);
              } else {
                return from(fetch(url).then((res) => res.text()));
              }
            }),
            tap((ndjson) => {
              if (ndjson) {
                this.downloads[key].rows = ndjson
                  .split('\n')
                  .filter((s) => !!s)
                  .map((row) => new LogEntry(row));
                this.cdr?.markForCheck();
              }
            }),
          ),
        ),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  download(eventType: EventType, month: string) {
    let show =
      eventType === EventType.SEARCH ? searchColumns : eventType === EventType.CHAT ? chatColumns : resourceColumns;
    this.sdk.currentKb
      .pipe(
        switchMap((kb) =>
          kb.activityMonitor
            .createActivityLogDownload(
              eventType,
              {
                year_month: month,
                filters: {},
                notify_via_email: true,
                show,
              },
              'application/x-ndjson',
            )
            .pipe(
              tap((res) => {
                const key = `${eventType}-${month}`;
                this.downloads[key] = { status: 'pending', requestId: res.request_id };
                this.watchList.next({ key: key, requestId: res.request_id });
                this.cdr?.markForCheck();
              }),
            ),
        ),
        switchMap(() => this.email),
        take(1),
      )
      .subscribe((email) => {
        this.toaster.success(this.translate.instant('activity.email-sent', { email }));
      });
  }

  selectTab(tab: Tab) {
    this.selectedTab = tab;
    this.selectedActivityTab = this.activityTabs[tab][0];
    this.cdr?.markForCheck();
  }

  formatDate(value: string) {
    const [year, month] = value.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 2);
    return format(date, 'MMMM yyyy');
  }
}
