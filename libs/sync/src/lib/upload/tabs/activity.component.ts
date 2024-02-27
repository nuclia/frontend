import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SyncService } from '../../sync/sync.service';
import { Subject, catchError, filter, map, of, repeat, switchMap, takeUntil, timer } from 'rxjs';
import { SyncRow } from '../../sync/new-models';

@Component({
  selector: 'nsy-activity',
  templateUrl: 'activity.component.html',
  styleUrls: ['activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncActivityComponent implements OnInit, OnDestroy {
  unSubscribeAll = new Subject<void>();
  since = '';
  currentIndex = 0;
  logs: { index: number; date: string; message: string; icon: string }[] = [];

  constructor(
    private syncService: SyncService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.syncService.currentSourceId
      .pipe(
        filter((id) => !!id),
        switchMap((id) => of(id).pipe(repeat({ delay: () => timer(10000) }))),
        switchMap((id) =>
          this.syncService.getLogs(id!, this.since).pipe(
            catchError((error) => {
              console.error('Error while fetching logs', error);
              return of([] as SyncRow[]);
            }),
          ),
        ),
        map((logs) =>
          logs.map((log, index) => ({
            index: index + this.currentIndex,
            date: log.date,
            message: log.errors,
            icon: log.level === 'high' ? 'circle-cross' : log.level === 'medium' ? 'warning' : 'circle-check',
          })),
        ),
        takeUntil(this.unSubscribeAll),
      )
      .subscribe((logs) => {
        this.since = logs[0]?.date || this.since;
        this.currentIndex += logs.length;
        this.logs = logs.concat(this.logs);
        this.cdr.markForCheck();
      });
  }
  ngOnDestroy() {
    this.unSubscribeAll.next();
    this.unSubscribeAll.complete();
  }
}
