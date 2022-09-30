import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { map, Observable, take } from 'rxjs';
import { FileStatus } from '../sync/models';
import { SyncService } from '../sync/sync.service';
import { Router } from '@angular/router';
import { STFTrackingService } from '@flaps/core';

type SectionType = 'pending' | 'active' | 'completed';

interface SectionSync {
  date: string;
  from: string;
  to: string;
  total: number;
  progress: number;
  started: boolean | undefined;
  completed: boolean | undefined;
}

@Component({
  selector: 'nde-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private queue: Observable<SectionSync[]> = this.sync.queue.pipe(
    map((syncs) =>
      syncs.map((sync) => ({
        date: sync.date.slice(0, 10),
        from: this.sync.sources[sync.source]?.definition.title,
        to: this.sync.destinations[sync.destination.id]?.definition.title,
        total: sync.files.length,
        progress: (100 * sync.files.filter((f) => f.status === FileStatus.UPLOADED).length) / sync.files.length,
        started: sync.started,
        completed: sync.completed,
      })),
    ),
  );
  pending = this.queue.pipe(map((syncs) => syncs.filter((sync) => !sync.completed && !sync.started)));
  pendingCount = this.pending.pipe(map((syncs) => this.getFileCount(syncs)));

  active = this.queue.pipe(map((syncs) => syncs.filter((sync) => !sync.completed && sync.started)));
  activeCount = this.active.pipe(map((syncs) => this.getFileCount(syncs)));

  completed = this.queue.pipe(map((syncs) => syncs.filter((sync) => sync.completed)));
  completedCount = this.completed.pipe(map((syncs) => this.getFileCount(syncs)));

  sections = [
    { title: 'home.pending', type: 'pending', items: this.pending, count: this.pendingCount },
    { title: 'home.active', type: 'active', items: this.active, count: this.activeCount },
    { title: 'home.completed', type: 'completed', items: this.completed, count: this.completedCount },
  ];

  selected: SectionType | null = null;

  constructor(
    private sync: SyncService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private tracking: STFTrackingService,
  ) {
    this.active.pipe(take(1)).subscribe((syncs) => {
      this.selected = syncs.length > 0 ? 'active' : null;
      this.cdr?.markForCheck();
    });
  }

  toggle(section: SectionType) {
    this.selected = this.selected === section ? null : section;
    this.cdr?.markForCheck();
  }

  addUpload() {
    this.tracking.logEvent('desktop:new_upload');
    this.router.navigateByUrl('/add-upload');
  }

  private getFileCount(syncs: SectionSync[]): number {
    return syncs.reduce((total, sync) => {
      total += sync.total;
      return total;
    }, 0);
  }
}
