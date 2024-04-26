import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SyncService } from '../logic/sync.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
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
      this.syncService.connectorsObs.pipe(map((sources) => sources.find((s) => s.id === sync.connector.name))),
    ),
  );
  canSelectFiles = this.syncService
    .getCurrentSync()
    .pipe(map((sync) => this.syncService.canSelectFiles(sync.id || '')));
  selectedTab = 'activity';
  enabled = this.currentSync.pipe(map((sync) => !sync.disabled));
  private unsubscribeAll = new Subject<void>();

  constructor(
    private syncService: SyncService,
    private router: Router,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.syncService.setCurrentSyncId(params.get('id') || '');
    });
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => (event as NavigationEnd).url.split('/upload/sync/')[1]?.split('/')[0]),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((sourceId) => {
        this.syncService.setCurrentSyncId(sourceId);
        this.selectedTab = 'activity';
        this.cdr.markForCheck();
      });
    this.currentSync
      .pipe(
        take(1),
        switchMap((sync) =>
          this.syncService.hasCurrentSourceAuth().pipe(
            filter((hasAuth) => !hasAuth),
            switchMap(() => this.syncService.getConnector(sync.connector.name, sync.id)),
            switchMap((connector) => this.syncService.authenticateToConnector(sync.connector.name, connector)),
          ),
        ),
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
    this.syncService.currentSyncId
      .pipe(
        take(1),
        switchMap((id) => this.syncService.deleteSync(id || '')),
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

  goTo(tab: string) {
    this.selectedTab = tab;
    this.cdr.markForCheck();
  }

  toggle() {
    this.currentSync
      .pipe(
        take(1),
        switchMap((sync) => this.syncService.updateSync(sync.id, { disabled: !sync.disabled })),
      )
      .subscribe({
        error: () => {
          this.toast.error('upload.failed');
        },
      });
  }
}
