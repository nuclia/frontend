import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { map, Observable, shareReplay, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { EventType } from '@nuclia/core';
import { format } from 'date-fns';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-activity-download',
  templateUrl: './activity-download.component.html',
  styleUrls: ['./activity-download.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDownloadComponent implements OnDestroy {
  eventTypes = {
    searches: [EventType.CHAT, EventType.SEARCH],
    resources: [EventType.PROCESSED, EventType.NEW, EventType.MODIFIED],
  };
  selectedTab: 'resources' | 'searches' = 'resources';
  selectedEventType: EventType = this.eventTypes[this.selectedTab][0];
  urls: string[] = [];

  activity = [...this.eventTypes.searches, ...this.eventTypes.resources].reduce((acc, eventType) => {
    acc[eventType] = this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.listActivityDownloads(eventType)),
      map((res) =>
        res.downloads
          .sort((a, b) => a.localeCompare(b) * -1)
          .map((month) => ({ month, formatted: this.formatDate(month) })),
      ),
      shareReplay(),
    );
    return acc;
  }, {} as { [key in EventType]: Observable<{ month: string; formatted: string }[]> });

  constructor(private sdk: SDKService, private cdr: ChangeDetectorRef, @Inject(WINDOW) private window: Window) {}

  ngOnDestroy() {
    this.urls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
  }

  download(month: string) {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.downloadActivity(this.selectedEventType, month)),
      )
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        this.urls.push(url);
        this.window.open(url, 'blank', 'noreferrer');
      });
  }

  selectTab(tab: 'searches' | 'resources') {
    this.selectedTab = tab;
    this.selectedEventType = this.eventTypes[tab][0];
    this.cdr?.markForCheck();
  }

  formatDate(value: string) {
    const [year, month] = value.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 2);
    return format(date, 'MMMM yyyy');
  }
}
