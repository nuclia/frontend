import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { filter, from, map, switchMap } from 'rxjs';
import { Source } from '../sync/models';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'nde-sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  currentStep = this.sync.step;
  steps = ['upload.steps.source', 'upload.steps.configure', 'upload.steps.data', 'upload.steps.destination'];
  hasActiveUploads = this.sync.queue.pipe(map((syncs) => syncs.some((sync) => !sync.completed)));
  sources = this.sync.step.pipe(
    filter((step) => step === 0),
    switchMap(() => this.sync.sourcesCache),
    map((s) => Object.entries(s).map(([id, source]) => ({ name: id, connectorId: source.connectorId }))),
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
