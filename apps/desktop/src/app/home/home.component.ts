import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { map, take } from 'rxjs';
import { FileStatus } from '../sync/models';
import { SyncService } from '../sync/sync.service';

type SectionType = 'pending' | 'active' | 'completed';

@Component({
  selector: 'da-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private queue = this.sync.queue.pipe(
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
  active = this.queue.pipe(map((syncs) => syncs.filter((sync) => sync.started)));
  completed = this.queue.pipe(map((syncs) => syncs.filter((sync) => sync.completed)));
  
  sections = [
    { title: 'home.pending', type: 'pending', items: this.pending },
    { title: 'home.active', type: 'active', items: this.active },
    { title: 'home.completed', type: 'completed', items: this.completed },
  ];

  selected: SectionType | null = null;

  constructor(private sync: SyncService, private cdr: ChangeDetectorRef) {
    this.active.pipe(take(1)).subscribe((syncs) => {
      this.selected = syncs.length > 0 ? 'active' : null;
      this.cdr?.markForCheck();
    })
  }

  toggle(section: SectionType) {
    this.selected = this.selected === section ? null : section;
    this.cdr?.markForCheck();
  }
}