import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, repeat, switchMap } from 'rxjs';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'nde-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  showActive = this.route.queryParams.pipe(map((params) => !!params.active));
  uploads = this.showActive.pipe(
    switchMap((active) => (active ? this.sync.getActiveLogs().pipe(repeat({ delay: 1000 })) : this.sync.getLogs())),
  );

  constructor(private sync: SyncService, private route: ActivatedRoute) {}
}
