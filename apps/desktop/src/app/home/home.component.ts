import { Component, ChangeDetectionStrategy } from '@angular/core';
import { map } from 'rxjs';
import { FileStatus } from '../sync/models';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'da-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  queue = this.sync.queue.pipe(
    map((syncs) =>
      syncs.map((sync) => ({
        date: sync.date.slice(0, 10),
        from: this.sync.sources[sync.source]?.definition.title,
        to: this.sync.destinations[sync.destination.id]?.definition.title,
        total: sync.files.length,
        progress: (100 * sync.files.filter((f) => f.status === FileStatus.UPLOADED).length) / sync.files.length,
      })),
    ),
  );
  constructor(private sync: SyncService) {}
}
