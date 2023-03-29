import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { filter, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { STFTrackingService } from '@flaps/core';
import {
  ConnectorDefinition,
  ConnectorParameters,
  ISourceConnector,
  CONNECTOR_ID_KEY,
  SyncItem,
  SOURCE_NAME_KEY,
} from '../sync/models';
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
      this.sync
        .getSource(this.sourceId)
        .pipe(take(1))
        .pipe(
          tap((source) => (this.source = source)),
          switchMap((source) => source.authenticate()),
          filter((yes) => yes),
        )
        .subscribe(() => {
          this.goTo(2);
          localStorage.removeItem(CONNECTOR_ID_KEY);
          localStorage.removeItem(SOURCE_NAME_KEY);
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
        const params = this.sync.getConnectorCache(data.connectorId, data.quickAccessName)?.params;
        const connector = this.sync.sources[data.connectorId].definition;
        this.selectSource({ name: data.quickAccessName, connector, params });
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

  selectSource(event: { name: string; connector: ConnectorDefinition; params?: ConnectorParameters }) {
    if (!event.name) {
      // TODO fox flow we always have names
      throw new Error('Name is mandatory');
    }
    this.sourceId = event.connector.id;
    this.tracking.logEvent('desktop:select_source', { sourceId: this.sourceId });
    this.sync.setSourceData(event.name, event.connector.id, event.params).subscribe();
    this.sync
      .getSource(event.connector.id)
      .pipe(
        take(1),
        switchMap((source) => {
          this.source = source;
          if (source.handleParameters && event.params) {
            source.handleParameters(event.params);
          }
          if (source.hasServerSideAuth) {
            localStorage.setItem(CONNECTOR_ID_KEY, event.connector.id);
            localStorage.setItem(SOURCE_NAME_KEY, event.name);
            source.goToOAuth();
          }
          return this.source.authenticate();
        }),
        filter((yes) => yes),
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
        source: localStorage.getItem(SOURCE_NAME_KEY) || '',
        destination: {
          id: event.connector.id,
          params: event.params,
        },
        files: this.selection.selected,
        resumable: !!this.source?.resumable,
        fileUUIDs: [],
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
