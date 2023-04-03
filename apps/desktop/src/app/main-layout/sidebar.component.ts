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
  currentStep = this.sync.step;
  sources = this.sync.sources;
  steps = ['upload.steps.source', 'upload.steps.configure', 'upload.steps.data', 'upload.steps.destination'];
  hasActiveUploads = this.sync.queue.pipe(map((syncs) => syncs.some((sync) => !sync.completed)));
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
  syncServer = this.sync.syncServer;

  constructor(private sync: SyncService, private router: Router) {}

  goToStep(step: number) {
    if (step === 0) {
      from(this.router.navigate(['/add-upload'])).subscribe(() => {
        setTimeout(() => {
          this.sync.goToFirstStep();
        }, 0);
      });
    }
  }

  goToSource(connectorId: string, quickAccessName: string, edit: boolean) {
    from(this.router.navigate(['/add-upload'])).subscribe(() => {
      setTimeout(() => {
        this.sync.goToSource(connectorId, quickAccessName, edit);
      }, 0);
    });
  }

  goToHistory(showActive = false) {
    this.router.navigate(['/history'], { queryParams: showActive ? { active: 'true' } : {} });
  }
}
