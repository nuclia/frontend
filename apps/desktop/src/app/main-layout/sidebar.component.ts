import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { filter, from, map } from 'rxjs';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'nde-sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  steps = ['upload.steps.source', 'upload.steps.configure', 'upload.steps.data', 'upload.steps.destination'];
  cache = this.sync.step.pipe(
    filter((step) => step === 0),
    map(() => Object.values(this.sync.getConnectorsCache())),
    map((items) =>
      items.sort((a, b) =>
        `${this.sync.sources[a.connectorId].definition.title}${a.name}`.localeCompare(
          `${this.sync.sources[b.connectorId].definition.title}${b.name}`,
        ),
      ),
    ),
  );

  constructor(private sync: SyncService, private router: Router) {}

  goToSource(connectorId: string, quickAccessName: string, edit: boolean) {
    from(this.router.navigate(['/add-upload'])).subscribe(() => {
      setTimeout(() => {
        this.sync.goToSource(connectorId, quickAccessName, edit);
      }, 0);
    });
  }
}
