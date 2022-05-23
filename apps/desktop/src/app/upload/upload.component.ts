import { SelectionModel } from '@angular/cdk/collections';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, filter, Observable, of, Subject, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConnectorParameters, SyncItem, ConnectorDefinition } from '../sync/models';
import { SyncService } from '../sync/sync.service';
import { ConfirmFilesComponent } from './confirm-files/confirm-files.component';

@Component({
  selector: 'da-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent {
  step = 0;
  sourceId = new BehaviorSubject<string>('');
  query = '';
  triggerSearch = new Subject();
  resources: Observable<SyncItem[]> = this.triggerSearch.pipe(
    switchMap(() => this.sourceId),
    filter((id) => !!id),
    switchMap((id) => this.sync.getSource(id)),
    switchMap((source) => source.getFiles(this.query)),
  );
  selection = new SelectionModel<SyncItem>(true, []);

  constructor(
    private sync: SyncService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog
  ) {}

  next() {
    this.step++;
    this.cdr.detectChanges();
  }

  selectSource(event: { connector: ConnectorDefinition; params?: ConnectorParameters }) {
    this.sourceId.next(event.connector.id);
    this.next();
  }

  selectDestination(event: { connector: ConnectorDefinition; params?: ConnectorParameters }) {
    this.dialog.open(ConfirmFilesComponent, {
      data: { files: this.selection.selected },
    })
    .afterClosed()
      .pipe(filter((result) => !!result))
      .subscribe(() => {
        this.sync.addSync({
          date: new Date().toISOString(),
          source: this.sourceId.getValue(),
          destination: {
            id: event.connector.id,
            params: event.params,
          },
          files: this.selection.selected,
        });
        this.router.navigate(['/']); 
      })
  }
}
