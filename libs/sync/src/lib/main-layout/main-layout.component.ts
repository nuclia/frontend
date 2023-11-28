import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SyncService } from '@nuclia/sync';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'nsy-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
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
  }
}
