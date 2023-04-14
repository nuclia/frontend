import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { delay, filter, forkJoin, map, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { STFTrackingService } from '@flaps/core';
import { ConnectorDefinition, ConnectorParameters, ISourceConnector, CONNECTOR_ID_KEY, SyncItem } from '../sync/models';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'nde-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent implements OnInit, OnDestroy {
  sourceId = '';
  source?: ISourceConnector;
  selection = new SelectionModel<SyncItem>(true, []);
  step = this.sync.step;
  quickAccess?: { connectorId: string; quickAccessName: string };
  unsubscribeAll = new Subject<void>();
  syncServer = this.sync.syncServer;

  constructor(
    private sync: SyncService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private tracking: STFTrackingService,
  ) {}

  ngOnInit() {
    this.sourceId = localStorage.getItem(CONNECTOR_ID_KEY) || '';
    // useful for dev mode in browser (in Electron, as the page is not reloaded, authneticate is already waiting for an answer)
    if (this.sourceId && !this.source) {
      forkJoin([this.sync.getSource(this.sourceId).pipe(take(1)), this.sync.hasCurrentSourceAuth()])
        .pipe(
          tap(([source]) => (this.source = source)),
          switchMap(([source, hasAuth]) => (hasAuth ? of(true) : this.sync.authenticateToSource(source))),
          filter((yes) => yes),
        )
        .subscribe(() => {
          this.goTo(2);
          localStorage.removeItem(CONNECTOR_ID_KEY);
          this.sync.setCurrentSourceId('');
        });
    }
    this.sync.showFirstStep.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.reset();
    });
    this.sync.showSource.pipe(takeUntil(this.unsubscribeAll)).subscribe((data) => {
      if (data.edit) {
        this.quickAccess = { connectorId: data.connectorId, quickAccessName: data.quickAccessName };
        this.goTo(1);
      } else {
        const params = this.sync.getSourceCache(data.quickAccessName).data;
        const connector = this.sync.sources[data.connectorId].definition;
        this.selectSource({ name: data.quickAccessName, connector, params }, false);
      }
    });
  }

  ngOnDestroy() {
    this.goTo(0);
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goTo(step: number) {
    this.sync.setStep(step);
  }

  selectSource(
    event: { name: string; connector: ConnectorDefinition; params?: ConnectorParameters; permanentSync?: boolean },
    update = true,
  ) {
    if (!event.name) {
      throw new Error('Name is mandatory');
    }
    this.sourceId = event.connector.id;
    this.tracking.logEvent('desktop:select_source', { sourceId: this.sourceId });
    (update
      ? this.sync
          .setSourceData(event.name, {
            connectorId: event.connector.id,
            data: event.params || {},
            permanentSync: !!event.permanentSync,
          })
          .pipe(map(() => true))
      : of(true)
    )
      .pipe(
        switchMap(() =>
          forkJoin([this.sync.getSource(event.connector.id).pipe(take(1)), this.sync.hasCurrentSourceAuth()]),
        ),
        switchMap(([source, hasAuth]) => {
          this.source = source;
          if (source.handleParameters && event.params) {
            source.handleParameters(event.params);
          }
          if (hasAuth) {
            return of(true);
          } else {
            if (source.hasServerSideAuth) {
              localStorage.setItem(CONNECTOR_ID_KEY, event.connector.id);
              this.sync.setCurrentSourceId(event.name);
              source.goToOAuth();
            }
            return this.sync.authenticateToSource(this.source);
          }
        }),
        filter((yes) => yes),
        delay(500), // wait for source data to be stored
      )
      .subscribe(() => {
        this.goTo(2);
      });
  }

  selectDestination(event: { connector: ConnectorDefinition; params: ConnectorParameters }) {
    this.tracking.logEvent('desktop:select_destination', { sourceId: event.connector.id });
    this.sync
      .addSync({
        date: new Date().toISOString(),
        source: this.sync.getCurrentSourceId(),
        destination: {
          id: event.connector.id,
          params: event.params,
        },
        items: this.selection.selected,
      })
      .subscribe();
    this.router.navigate(['/history'], { queryParams: { active: 'true' } });
  }

  private reset() {
    localStorage.removeItem(CONNECTOR_ID_KEY);
    this.sourceId = '';
    this.source = undefined;
    this.quickAccess = undefined;
    this.selection.clear();
    this.goTo(0);
  }

  cancel() {
    this.reset();
  }
}
