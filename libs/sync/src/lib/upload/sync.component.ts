import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SyncService } from '../sync/sync.service';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, map, switchMap, take, takeUntil } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';

@Component({
  templateUrl: 'sync.component.html',
  styleUrls: ['sync.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncComponent implements OnInit, OnDestroy {
  currentSync = this.syncService.getCurrentSync();
  connector = this.currentSync.pipe(
    switchMap((sync) =>
      this.syncService.sourceObs.pipe(map((sources) => sources.find((s) => s.id === sync.connector.name))),
    ),
  );
  selectedTab = 'activity';
  private unsubscribeAll = new Subject<void>();

  constructor(
    private syncService: SyncService,
    private router: Router,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.syncService.setCurrentSourceId(location.pathname.split('/upload/sync/')[1]?.split('/')[0]);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => (event as NavigationEnd).url.split('/upload/sync/')[1]?.split('/')[0]),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((sourceId) => {
        this.syncService.setCurrentSourceId(sourceId);
        this.cdr.markForCheck();
      });
    this.currentSync
      .pipe(
        take(1),
        switchMap((sync) =>
          this.syncService.hasCurrentSourceAuth().pipe(
            filter((hasAuth) => !hasAuth),
            switchMap(() => this.syncService.getSource(sync.connector.name, sync.id)),
          ),
        ),
        switchMap((source) => this.syncService.authenticateToSource(source)),
      )
      .subscribe({
        next: () => {
          this.toast.success('upload.authentication.success');
          this.router.navigate([], { queryParams: {} });
        },
        error: () => this.toast.error('upload.authentication.failed'),
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  delete() {
    this.syncService.currentSourceId
      .pipe(
        take(1),
        switchMap((id) => this.syncService.deleteSource(id || '')),
      )
      .subscribe({
        next: () => {
          const kbUrl = this.router.url.split('/upload/')[0];
          this.router.navigate([`${kbUrl}/upload`]);
        },
        error: () => {
          this.toast.error('upload.deletion-failed');
        },
      });
  }
}