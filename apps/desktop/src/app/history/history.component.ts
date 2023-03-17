import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, scan, switchMap } from 'rxjs';
import { FileStatus } from '../sync/models';
import { SyncService } from '../sync/sync.service';

interface SyncRow {
  id: string;
  date: string;
  from: string;
  to: string;
  total: number;
  kbSlug?: string;
  progress: number;
  started: boolean | undefined;
  completed: boolean | undefined;
}

@Component({
  selector: 'nde-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  private queue: Observable<SyncRow[]> = this.sync.queue.pipe(
    map((syncs) =>
      syncs.map((sync) => ({
        id: sync.date,
        date: sync.date.slice(0, 10),
        from: this.sync.sources[sync.source]?.definition.title,
        to: this.sync.destinations[sync.destination.id]?.definition.title,
        total: sync.files.length,
        kbSlug: sync.destination.params.kb,
        progress: (100 * sync.files.filter((f) => f.status === FileStatus.UPLOADED).length) / sync.files.length,
        started: sync.started,
        completed: sync.completed,
      })),
    ),
  );
  private completed = this.queue.pipe(map((syncs) => syncs.filter((sync) => sync.completed)));
  private pending = this.queue.pipe(
    map((syncs) => syncs.filter((sync) => !sync.completed)),
    scan((acc, curr) => {
      // Keep uploads that just completed and mark them as completed
      curr.forEach((item) => {
        const index = acc.findIndex((oldItem) => oldItem.id === item.id);
        index > -1 ? (acc[index] = item) : acc.push(item);
      });
      return acc.map((item) => (curr.every((newItem) => newItem.id !== item.id) ? { ...item, completed: true } : item));
    }, [] as SyncRow[]),
  );

  showActive = this.route.queryParams.pipe(map((params) => !!params.active));
  uploads = this.showActive.pipe(switchMap((active) => (active ? this.pending : this.completed)));

  constructor(private sync: SyncService, private route: ActivatedRoute) {}

  clear() {
    this.sync.clearCompleted();
  }
}
