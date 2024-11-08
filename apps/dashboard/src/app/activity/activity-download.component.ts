import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { map, Observable, shareReplay, switchMap, take } from 'rxjs';
import { SDKService, UserService } from '@flaps/core';
import { EventType } from '@nuclia/core';
import { format } from 'date-fns';
import { SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';

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
})
export class ActivityDownloadComponent {
  activityTabs: { [tab in Tab]: ActivityTab[] } = {
    searches: [EventType.CHAT, EventType.SEARCH],
    resources: [EventType.PROCESSED, EventType.NEW, EventType.MODIFIED],
  };
  completedDownloads: { [key: string]: boolean } = {};
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
  ) {}

  download(eventType: EventType, month: string) {
    let show =
      eventType === EventType.SEARCH ? searchColumns : eventType === EventType.CHAT ? chatColumns : resourceColumns;
    this.completedDownloads[`${eventType}-${month}`] = true;
    this.sdk.currentKb
      .pipe(
        switchMap((kb) =>
          kb.activityMonitor.createActivityLogDownload(
            eventType,
            {
              year_month: month,
              filters: {},
              notify_via_email: true,
              show,
            },
            'application/x-ndjson',
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
