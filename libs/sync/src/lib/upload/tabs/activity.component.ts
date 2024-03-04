import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SyncService } from '../../sync/sync.service';
import { Subject, catchError, filter, map, of, repeat, startWith, switchMap, take, takeUntil, tap, timer } from 'rxjs';
import { SyncRow } from '../../sync/new-models';
import { NavigationEnd, Router } from '@angular/router';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'nsy-activity',
  templateUrl: 'activity.component.html',
  styleUrls: ['activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncActivityComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  since = '';
  currentIndex = 0;
  logs: { index: number; date: string; message: string; icon: string }[] = [];
  syncing = false;

  constructor(
    private syncService: SyncService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private toast: SisToastService,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        tap(() => {
          this.since = '';
          this.logs = [];
          this.cdr.markForCheck();
        }),
        startWith(null),
        switchMap(() => this.syncService.currentSourceId),
        filter((id) => !!id),
        switchMap((id) => of(id).pipe(repeat({ delay: 10000 }))),
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
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((logs) => {
        this.since = logs[0]?.date || this.since;
        this.currentIndex += logs.length;
        this.logs = logs.concat(this.logs);
        this.cdr.markForCheck();
      });
  }
  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  triggerSync() {
    this.syncing = true;
    this.cdr.markForCheck();
    this.syncService.triggerSyncs().subscribe({
      complete: () => {
        this.syncing = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('upload.activity.error');
        this.syncing = false;
        this.cdr.markForCheck();
      },
    });
  }
}
