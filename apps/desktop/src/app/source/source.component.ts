import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { Resource } from '../sync/models';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'da-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceComponent {
  sourceId = '';
  resources: Observable<Resource[]> = this.route.params.pipe(
    map((res) => res.id),
    filter((id) => !!id),
    switchMap((id) => {
      this.sourceId = id;
      return this.sync.providers[id].getFiles();
    })
  );

  constructor(private route: ActivatedRoute, private sync: SyncService) {}

  disconnect() {
    if (this.sourceId) {
      this.sync.providers[this.sourceId].disconnect();
    }
  }
}
