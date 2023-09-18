import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, from, map, switchMap } from 'rxjs';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'nde-sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  sources = this.sync.step.pipe(
    switchMap(() => combineLatest([this.sync.sourcesCache, this.sync.sourceObs])),
    map(([sources, definitions]) =>
      Object.entries(sources).map(([id, source]) => ({
        name: id,
        connectorId: source.connectorId,
        logo: definitions.find((definition) => definition.id === source.connectorId)?.logo,
      })),
    ),
  );
  step = this.sync.step;
  currentSourceId = this.sync.currentSourceId;
  isServerPage = new BehaviorSubject(false);

  constructor(private sync: SyncService, private router: Router) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event: NavigationEnd) => event.url === '/server'),
      )
      .subscribe((isServer) => this.isServerPage.next(isServer));
  }

  goToSource(connectorId: string, sourceId: string) {
    from(this.router.navigate(['/add-upload'])).subscribe(() => {
      setTimeout(() => {
        this.sync.showSource.next({ connectorId, sourceId });
      }, 0);
    });
  }

  addSource() {
    from(this.router.navigate(['/add-upload'])).subscribe(() => {
      setTimeout(() => {
        this.sync.addSource.next();
      }, 0);
    });
  }
}
