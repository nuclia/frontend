import { SelectionModel } from '@angular/cdk/collections';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, filter, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConnectorParameters, SyncItem, ConnectorDefinition, ISourceConnector } from '../sync/models';
import { SyncService } from '../sync/sync.service';
import { ConfirmFilesComponent } from './confirm-files/confirm-files.component';

const SOURCE_ID_KEY = 'NUCLIA_SOURCE_ID';
@Component({
  selector: 'da-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent {
  step = 0;
  query = '';
  triggerSearch = new Subject<void>();
  sourceId = '';
  source?: ISourceConnector;
  resources: Observable<SyncItem[]> = this.triggerSearch.pipe(
    switchMap(() => (this.source ? this.source.getFiles(this.query) : of([]))),
  );
  selection = new SelectionModel<SyncItem>(true, []);

  constructor(
    private sync: SyncService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog,
  ) {
    this.sourceId = localStorage.getItem(SOURCE_ID_KEY) || '';
    if (this.sourceId) {
      this.step = 1;
      this.sync
        .getSource(this.sourceId)
        .pipe(take(1))
        .pipe(
          tap((source) => (this.source = source)),
          switchMap((source) => source.authenticate()),
        )
        .subscribe(() => localStorage.removeItem(SOURCE_ID_KEY));
    }
  }

  next() {
    this.step++;
    this.cdr.detectChanges();
  }

  selectSource(event: { connector: ConnectorDefinition; params?: ConnectorParameters }) {
    localStorage.setItem(SOURCE_ID_KEY, event.connector.id);
    this.sync
      .getSource(event.connector.id)
      .pipe(take(1))
      .subscribe((source) => source.goToOAuth());
  }

  selectDestination(event: { connector: ConnectorDefinition; params?: ConnectorParameters }) {
    this.dialog
      .open(ConfirmFilesComponent, {
        data: { files: this.selection.selected },
      })
      .afterClosed()
      .pipe(filter((result) => !!result))
      .subscribe(() => {
        this.sync.addSync({
          date: new Date().toISOString(),
          source: localStorage.getItem(SOURCE_ID_KEY) || '',
          destination: {
            id: event.connector.id,
            params: event.params,
          },
          files: this.selection.selected,
        });
        this.router.navigate(['/']);
      });
  }
}
