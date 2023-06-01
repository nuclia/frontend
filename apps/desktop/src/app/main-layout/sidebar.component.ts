import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter, from, map, switchMap } from 'rxjs';
import { SyncService } from '../sync/sync.service';
import { SisModalService } from '@nuclia/sistema';

@Component({
  selector: 'nde-sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  currentStep = this.sync.step;
  steps = ['upload.steps.source', 'upload.steps.configure', 'upload.steps.data', 'upload.steps.destination'];
  sources = this.sync.step.pipe(
    filter((step) => step === 0),
    switchMap(() => this.sync.sourcesCache),
    map((s) => Object.entries(s).map(([id, source]) => ({ name: id, connectorId: source.connectorId }))),
  );

  isServerPage = new BehaviorSubject(false);

  constructor(private sync: SyncService, private router: Router, private modalService: SisModalService) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event: NavigationEnd) => event.url === '/server'),
      )
      .subscribe((isServer) => this.isServerPage.next(isServer));
  }

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

  deleteSource(quickAccessName: string) {
    this.modalService
      .openConfirm({
        title: `upload.source.confirm-delete`,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.sync.deleteSource(quickAccessName)),
      )
      .subscribe();
  }
}
