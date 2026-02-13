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
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { SDKService, UserService } from '@flaps/core';
import { SisProgressModule, SisToastService } from '@nuclia/sistema';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LogEntry } from './log.models';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { CommonModule } from '@angular/common';
import { ActivityLogTableComponent } from './log-table.component';
import { PaButtonModule, PaExpanderModule, PaIconModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

type ActivityDownload = {
  status: 'pending' | 'stored' | 'downloading' | 'completed';
  requestId?: string;
  url?: string;
  rows?: LogEntry[];
};

@Component({
  imports: [
    ActivityLogTableComponent,
    CommonModule,
    PaButtonModule,
    PaExpanderModule,
    PaIconModule,
    PaTooltipModule,
    SisProgressModule,
    TranslateModule,
  ],
  templateUrl: './agent-activity.component.html',
  styleUrls: ['./agent-activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentActivityComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();

  downloads: { [month: string]: ActivityDownload } = {};
  watchList = new Subject<{ month: string; requestId: string }>();
  email = this.user.userPrefs.pipe(map((user) => user?.email || ''));
  visibleTables: { [month: string]: boolean } = {};

  months = this.sdk.currentArag.pipe(
    take(1),
    map((arag) => {
      const creationDate = new Date(arag.created + 'Z');
      return this.getLastMonths(12)
        .filter((months) => months.end > creationDate)
        .map((month) => ({
          month: format(month.start, 'yyyy-MM'),
          date: month.start,
        }));
    }),
  );

  constructor(
    private sdk: SDKService,
    private user: UserService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private translate: TranslateService,
  ) {
    this.getStoredActivity().subscribe((downloads) => {
      this.downloads = downloads;
      this.cdr.markForCheck();
    });
    this.watchList
      .pipe(
        mergeMap(({ month, requestId }) =>
          this.sdk.currentArag.pipe(
            concatMap((arag) =>
              of(null).pipe(
                repeat({ delay: 5000 }),
                takeUntil(this.unsubscribeAll),
                switchMap(() => arag.getDownload(requestId)),
                filter((data) => {
                  if (data.download_url) {
                    this.downloads[month].status = 'stored';
                    this.downloads[month].url = data.download_url;
                    this.cdr?.markForCheck();
                    return true;
                  }
                  return false;
                }),
                take(1),
                concatMap(() => {
                  const url = this.downloads[month].url;
                  if (!url) {
                    return of(null);
                  } else {
                    return this.fetchRows(this.downloads[month]);
                  }
                }),
              ),
            ),
          ),
        ),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  requestDownload(month: string) {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => {
          const date = this.parseDate(month);
          return arag.requestActivityDownload({
            format: 'ndjson',
            year: date.getFullYear(),
            month: date.getMonth() + 1,
          });
        }),
        tap((status) => {
          this.downloads[month] = { status: 'pending', requestId: status.id };
          this.watchList.next({ month, requestId: status.id });
          this.cdr?.markForCheck();
        }),
        switchMap(() => this.email),
        take(1),
      )
      .subscribe((email) => {
        this.toaster.success(this.translate.instant('activity.email-sent', { email }));
      });
  }

  toggleExpander(month: string) {
    this.visibleTables[month] = !this.visibleTables[month];
    const download = this.downloads[month];
    if (download.status === 'stored') {
      download.status = 'downloading';
      this.fetchRows(download).subscribe();
    }
  }

  fetchRows(download: ActivityDownload) {
    return from(fetch(download.url || '').then((res) => res.text())).pipe(
      tap((ndjson) => {
        download.rows = ndjson ? this.parseNdjson(ndjson) : [];
        download.status = 'completed';
        this.cdr?.markForCheck();
      }),
    );
  }

  parseDate(value: string) {
    const [year, month] = value.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 2);
  }

  parseNdjson(ndjson: string) {
    return ndjson
      .split('\n')
      .filter((s) => !!s)
      .map((row) => new LogEntry(row))
      .reverse();
  }

  getStoredActivity(): Observable<{ [month: string]: ActivityDownload }> {
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => arag.getDownloads()),
      map((downloads) => {
        return downloads.reduce(
          (acc, curr) => {
            const key = `${curr.query['year']}-${curr.query['month'].toString().padStart(2, '0')}`;
            acc[key] = {
              requestId: curr.id,
              status: curr.status === 'ready' ? 'stored' : 'pending',
              url: curr.download_url,
              rows: undefined,
            };
            if (curr.status === 'pending') {
              this.watchList.next({ month: key, requestId: curr.id });
            }
            return acc;
          },
          {} as { [month: string]: ActivityDownload },
        );
      }),
    );
  }

  getLastMonths(num: number) {
    const months: { start: Date; end: Date }[] = [];
    for (let i = 0; i < num; i++) {
      const month = subMonths(new Date(), i);
      months.push({
        start: startOfMonth(month),
        end: endOfMonth(month),
      });
    }
    return months;
  }
}
