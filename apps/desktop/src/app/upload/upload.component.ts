import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { delay, filter, forkJoin, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { STFTrackingService } from '@flaps/core';
import { CONNECTOR_ID_KEY, ISourceConnector, SOURCE_NAME_KEY } from '../sync/models';
import { SyncService } from '../sync/sync.service';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'nde-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent implements OnInit, OnDestroy {
  steps = ['source', 'configure', 'data'];
  step = this.sync.step;
  currentSourceId = this.sync.currentSourceId;
  unsubscribeAll = new Subject<void>();

  newConnector?: string;

  constructor(
    private sync: SyncService,
    private router: Router,
    private tracking: STFTrackingService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const connectorId = localStorage.getItem(CONNECTOR_ID_KEY) || '';
    const sourceName = localStorage.getItem(SOURCE_NAME_KEY) || '';
    // useful for dev mode in browser (in Electron, as the page is not reloaded, authenticate is already waiting for an answer)
    if (connectorId && sourceName) {
      this.sync.setCurrentSourceId(sourceName);
      forkJoin([this.sync.getSource(connectorId).pipe(take(1)), this.sync.hasCurrentSourceAuth()])
        .pipe(
          switchMap(([source, hasAuth]) => (hasAuth ? of(true) : this.sync.authenticateToSource(source))),
          filter((yes) => yes),
        )
        .subscribe(() => {
          this.goTo(2);
          localStorage.removeItem(CONNECTOR_ID_KEY);
          localStorage.removeItem(SOURCE_NAME_KEY);
        });
    } else {
      this.goTo(0);
    }
    this.sync.addSource.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.reset();
      this.goTo(0);
    });
    this.sync.showSource.pipe(takeUntil(this.unsubscribeAll)).subscribe((data) => {
      this.selectSource({ connectorId: data.connectorId, name: data.sourceId });
    });
  }

  ngOnDestroy() {
    this.goTo(-1);
    this.sync.clearCurrentSourceId();
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goTo(step: number) {
    this.sync.step.pipe(take(1)).subscribe((currentStep) => {
      if (currentStep === step) {
        // Force refresh
        this.sync.setStep(-1);
        this.cdr.detectChanges();
      }
      this.sync.setStep(step);
    });
  }

  onSelectConnector(connectorId: string) {
    this.newConnector = connectorId;
    this.goTo(1);
  }

  goToSettings() {
    this.newConnector = undefined;
    this.goTo(1);
  }

  selectSource(event: { name: string; connectorId: string }) {
    let sourceInstance: ISourceConnector;
    if (!event.name) {
      throw new Error('Name is mandatory');
    }
    this.reset();
    this.sync.setCurrentSourceId(event.name);
    this.tracking.logEvent('desktop:select_source', { sourceId: event.connectorId });

    forkJoin([
      this.sync.getSource(event.connectorId).pipe(take(1)),
      this.sync.currentSource.pipe(take(1)),
      this.sync.hasCurrentSourceAuth(),
    ])
      .pipe(
        switchMap(([source, sourceData, hasAuth]) => {
          sourceInstance = source;
          if (source.handleParameters && sourceData.data) {
            source.handleParameters(sourceData.data);
          }
          if (hasAuth) {
            return of(true);
          } else {
            if (source.hasServerSideAuth) {
              if (!(window as any)['electron']) {
                localStorage.setItem(CONNECTOR_ID_KEY, event.connectorId);
                localStorage.setItem(SOURCE_NAME_KEY, event.name);
              }
              source.goToOAuth(true);
              return this.sync.authenticateToSource(sourceInstance);
            } else {
              this.toaster.error('Missing authentication');
              this.goToSettings();
              return of(false);
            }
          }
        }),
        filter((yes) => yes),
        delay(500), // wait for source data to be stored
      )
      .subscribe(() => {
        this.goTo(2);
      });
  }

  private reset() {
    localStorage.removeItem(CONNECTOR_ID_KEY);
    localStorage.removeItem(SOURCE_NAME_KEY);
    this.newConnector = undefined;
    this.goTo(-1);
    this.sync.clearCurrentSourceId();
  }

  cancel() {
    this.reset();
    this.router.navigate(['/']);
  }
}
