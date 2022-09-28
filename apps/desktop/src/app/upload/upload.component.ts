import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { filter, switchMap, take, tap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { STFTrackingService } from '@flaps/core';
import { ConnectorDefinition, ConnectorParameters, ISourceConnector, SOURCE_ID_KEY, SyncItem } from '../sync/models';
import { SyncService } from '../sync/sync.service';
import { ConfirmFilesComponent } from './confirm-files/confirm-files.component';

@Component({
  selector: 'nde-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent implements OnInit {
  step = 0;
  sourceId = '';
  source?: ISourceConnector;
  selection = new SelectionModel<SyncItem>(true, []);

  constructor(
    private sync: SyncService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog,
    private tracking: STFTrackingService,
  ) {}

  ngOnInit() {
    this.sourceId = localStorage.getItem(SOURCE_ID_KEY) || '';
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
          this.goTo(1);
          localStorage.removeItem(SOURCE_ID_KEY);
        });
    }
  }

  goTo(step: number) {
    this.step = step;
    this.cdr.detectChanges();
  }

  selectSource(event: { connector: ConnectorDefinition; params?: ConnectorParameters }) {
    this.sourceId = event.connector.id;
    this.tracking.logEvent('desktop:select_source', { sourceId: this.sourceId });
    this.sync
      .getSource(event.connector.id)
      .pipe(
        take(1),
        switchMap((source) => {
          this.source = source;
          if (source.hasServerSideAuth) {
            localStorage.setItem(SOURCE_ID_KEY, event.connector.id);
            source.goToOAuth();
          }
          return this.source.authenticate(event.params);
        }),
        filter((yes) => yes),
      )
      .subscribe(() => {
        this.goTo(1);
      });
  }

  selectDestination(event: { connector: ConnectorDefinition; params: ConnectorParameters }) {
    this.tracking.logEvent('desktop:select_destination', { sourceId: event.connector.id });
    this.goTo(3);
    this.dialog
      .open(ConfirmFilesComponent, {
        data: { files: this.selection.selected },
      })
      .afterClosed()
      .pipe(filter((result) => !!result))
      .subscribe(() => {
        this.tracking.logEvent('desktop:upload_confirm');
        this.sync.addSync({
          date: new Date().toISOString(),
          source: this.sourceId,
          destination: {
            id: event.connector.id,
            params: event.params,
          },
          files: this.selection.selected,
          resumable: !!this.source?.resumable,
          fileUUIDs: [],
        });
        this.router.navigate(['/']);
      });
  }

  private reset() {
    localStorage.removeItem(SOURCE_ID_KEY);
    this.sourceId = '';
    this.source = undefined;
  }

  cancel() {
    this.reset();
    this.router.navigate(['/']);
  }

  goBackTo(step: number) {
    this.step = step;
    if (step === 0) {
      this.reset();
    }
    this.cdr?.markForCheck();
  }
}
