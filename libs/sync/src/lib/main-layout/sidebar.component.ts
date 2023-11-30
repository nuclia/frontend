import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, from, map, switchMap, take } from 'rxjs';
import { SyncService } from '../sync/sync.service';
import { BackendConfigurationService } from '@flaps/core';

@Component({
  selector: 'nsy-sidebar',
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
  basePath = this.sync.basePath;
  isServerDown = this.sync.isServerDown;
  currentSourceId = this.sync.currentSourceId;
  isServerPage = new BehaviorSubject(false);
  isDashboard = this.config.staticConf.client === 'dashboard';

  constructor(
    private sync: SyncService,
    private router: Router,
    private config: BackendConfigurationService,
  ) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => event as NavigationEnd),
        map((event) => event.url.endsWith('/server')),
      )
      .subscribe((isServer) => this.isServerPage.next(isServer));
  }

  goToSource(connectorId: string, sourceId: string) {
    this.basePath
      .pipe(
        take(1),
        switchMap((path) => from(this.router.navigate([path + 'add-upload']))),
      )
      .subscribe(() => {
        setTimeout(() => {
          this.sync.showSource.next({ connectorId, sourceId });
        }, 0);
      });
  }

  addSource() {
    this.basePath
      .pipe(
        take(1),
        switchMap((path) => from(this.router.navigate([path + 'add-upload']))),
      )
      .subscribe(() => {
        setTimeout(() => {
          this.sync.addSource.next();
        }, 0);
      });
  }
}
