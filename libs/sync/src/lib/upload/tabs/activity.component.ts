import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { SyncService } from '../../logic/sync.service';
import { catchError, filter, map, of, repeat, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { LogEntity } from '../../logic/models';
import { NavigationEnd, Router } from '@angular/router';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'nsy-activity',
  templateUrl: 'activity.component.html',
  styleUrls: ['activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncActivityComponent implements OnInit, OnDestroy {
  @Output() goTo = new EventEmitter<string>();
  unsubscribeAll = new Subject<void>();
  since = '';
  currentIndex = 0;
  logs: { index: number; date: string; message: string; icon: string }[] = [];
  syncing = false;
  currentSync = this.syncService.getCurrentSync();
  canSelectFiles = this.syncService.currentSourceId.pipe(
    map((sourceId) => this.syncService.canSelectFiles(sourceId || '')),
  );
  noFolderSelected = this.currentSync.pipe(map((sync) => !sync.foldersToSync || sync.foldersToSync.length === 0));
  disabled = this.currentSync.pipe(map((sync) => !!sync.disabled));

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
              return of([] as LogEntity[]);
            }),
          ),
        ),
        map((logs) =>
          logs.map((log, index) => ({
            index: index + this.currentIndex,
            date: log.createdAt,
            message: log.message,
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
