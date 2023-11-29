import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { SyncService } from '@nuclia/sync';
import { ActivatedRoute } from '@angular/router';
import { filter, map, of, repeat, switchMap, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'nsy-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();

  constructor(
    private sync: SyncService,
    private route: ActivatedRoute,
  ) {
    const path = this.route.pathFromRoot
      .map((item) => item.snapshot.url)
      .filter((segments) => segments.length > 0)
      .map((segments) => segments.map((segment) => segment.path).join('/'))
      .join('/');
    this.sync.setBasePath(path ? `/${path}/` : '/');

    of(true)
      .pipe(
        filter(() => !!this.sync.getSyncServer()),
        switchMap(() => this.sync.serverStatus(this.sync.getSyncServer())),
        map((res) => !res.running),
        repeat({ delay: 5000 }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((isServerDown) => this.sync.setServerStatus(isServerDown));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
