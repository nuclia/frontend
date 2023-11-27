import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { SyncService } from '../sync/sync.service';
import { BehaviorSubject, filter, map, of, repeat, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { SyncRow } from '../sync/models';
import { ActivatedRoute } from '@angular/router';

interface ProgressRow extends SyncRow {
  percent: number;
}

@Component({
  selector: 'nsy-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent implements OnDestroy {
  private unSubscribeAll = new Subject<void>();
  private _logs: BehaviorSubject<SyncRow[]> = new BehaviorSubject<SyncRow[]>([]);
  private _activeLogs: BehaviorSubject<ProgressRow[]> = new BehaviorSubject<ProgressRow[]>([]);
  private _showActive = this.route.queryParams.pipe(map((params) => !!params.active));

  activeLogs = this._activeLogs.asObservable();
  uploads = this._logs.asObservable();

  constructor(private sync: SyncService, private route: ActivatedRoute) {
    this.sync.getLogs().subscribe((logs) => this._logs.next(logs));

    this._showActive
      .pipe(
        filter((active) => active),
        switchMap(() =>
          this.sync.getActiveLogs().pipe(
            repeat({ delay: 1000 }),
            tap((activeLogs) =>
              this._activeLogs.next(
                activeLogs.map((log) => ({
                  ...log,
                  percent: Math.round(((log.progress + 1) / (log.total || 1)) * 100),
                })),
              ),
            ),
            switchMap((actives) => (actives.length === 0 ? this.sync.getLogs(this._logs.getValue()[0]?.date) : of([]))),
          ),
        ),
        takeUntil(this.unSubscribeAll),
      )
      .subscribe((logs) => {
        if (logs.length > 0) {
          this._logs.next(logs.reverse().concat(this._logs.getValue()));
        }
      });
  }

  ngOnDestroy() {
    this.unSubscribeAll.next();
    this.unSubscribeAll.complete();
  }

  cleanHistory() {
    this.sync.clearLogs().subscribe(() => this._logs.next([]));
  }
}
