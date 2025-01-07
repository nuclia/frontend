import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { filter, Subject, switchMap, takeUntil, timer } from 'rxjs';
import { SyncService } from './logic';

@Component({
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncRootComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private syncService = inject(SyncService);

  // Check sync server status only when on sync pages
  ngOnInit(): void {
    let isUp = false;
    let count = 0;
    timer(0, 5000)
      .pipe(
        filter(() => {
          // Delay of 1min when the server is running (we skip 12 interval of 5s),
          // and 5s when the server is down
          const skip = isUp ? 12 : 0;
          const pass = count >= skip;
          count++;
          return pass;
        }),
        switchMap(() => this.syncService.serverStatus(this.syncService.getSyncServer())),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((res) => {
        isUp = res.running;
        count = 0;
        this.syncService.setServerStatus(!isUp);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
