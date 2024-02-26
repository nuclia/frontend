import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { map, Observable, shareReplay, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { EventType } from '@nuclia/core';
import { format } from 'date-fns';
import { WINDOW } from '@ng-web-apis/common';

type Tab = 'resources' | 'searches';
type ActivityTab = EventType | 'feedback';

@Component({
  selector: 'app-activity-download',
  templateUrl: './activity-download.component.html',
  styleUrls: ['./activity-download.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDownloadComponent {
  activityTabs: { [tab in Tab]: ActivityTab[] } = {
    searches: [EventType.CHAT, EventType.SEARCH, 'feedback'],
    resources: [EventType.PROCESSED, EventType.NEW, EventType.MODIFIED],
  };
  selectedTab: Tab = 'resources';
  selectedActivityTab: ActivityTab = this.activityTabs[this.selectedTab][0];

  activity = [...this.activityTabs.searches, ...this.activityTabs.resources].reduce(
    (acc, tab) => {
      acc[tab] = this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) =>
          tab === 'feedback' ? kb.listFeedback() : kb.listActivityDownloads(tab).pipe(map((res) => res.downloads)),
        ),
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
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
  ) {}

  download(month: string) {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb
            .getTempToken()
            .pipe(
              map((token) =>
                this.selectedActivityTab === 'feedback'
                  ? this.sdk.nuclia.rest.getFullUrl(`/kb/${kb.id}/feedback/${month}?eph-token=${token}`)
                  : this.sdk.nuclia.rest.getFullUrl(
                      `/kb/${kb.id}/activity/download?type=${this.selectedActivityTab}&month=${month}&eph-token=${token}`,
                    ),
              ),
            ),
        ),
      )
      .subscribe((url) => {
        this.window.open(url, 'blank', 'noreferrer');
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
