import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { delay, filter, forkJoin, map, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { STFTrackingService } from '@flaps/core';
import {
  CONNECTOR_ID_KEY,
  ConnectorDefinition,
  ConnectorParameters,
  FileStatus,
  ISourceConnector,
  SyncItem,
} from '../sync/models';
import { SyncService } from '../sync/sync.service';
import { SisToastService } from '@nuclia/sistema';

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
    private router: Router,
    private tracking: STFTrackingService,
    private toaster: SisToastService,
  ) {}

  ngOnInit() {
    this.sourceId = localStorage.getItem(CONNECTOR_ID_KEY) || '';
    // useful for dev mode in browser (in Electron, as the page is not reloaded, authenticate is already waiting for an answer)
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
    this.sync.setCurrentSourceId(event.name);
    this.tracking.logEvent('desktop:select_source', { sourceId: this.sourceId });
    (update
      ? this.sync
          .setSourceData(event.name, {
            connectorId: event.connector.id,
            data: event.params || {},
            permanentSync: !!event.permanentSync,
          })
          .pipe(
            delay(500), // let the data be stored before querying it
            map(() => true),
          )
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
              source.goToOAuth(true);
              return this.sync.authenticateToSource(this.source);
            } else {
              this.toaster.error('Missing authentication');
              this.sync.goToSource(event.connector.id, event.name, true);
              return of(false);
            }
          }
        }),
        filter((yes) => yes),
        delay(500), // wait for source data to be stored
      )
      .subscribe(() => {
        const cache = this.sync.getSourceCache(event.name);
        if (event.connector.id === 'folder' && cache.permanentSync) {
          const data = this.source?.getParametersValues();
          if (data) {
            this.selection.setSelection({
              uuid: '',
              title: data.path,
              originalId: data.path,
              metadata: {},
              status: FileStatus.PENDING,
            });
            this.goTo(3);
          }
          // TODO: do not hardcode this condition
        } else if (event.connector.id === 'sitemap') {
          const data = this.source?.getParametersValues();
          if (data) {
            this.selection.setSelection({
              uuid: '',
              title: data.url,
              originalId: data.url,
              metadata: {},
              status: FileStatus.PENDING,
            });
            this.goTo(3);
          }
        } else {
          this.goTo(2);
        }
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
      .subscribe((success) => {
        if (success) {
          this.router.navigate(['/history'], { queryParams: { active: 'true' } });
        }
      });
  }

  private reset() {
    const sourceId = this.sync.getCurrentSourceId();
    if (sourceId) {
      this.sync.deleteSource(sourceId).subscribe();
    }
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
