import { SelectionModel } from '@angular/cdk/collections';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/auth';
import { forkJoin, Observable, Subject } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { ISourceConnector, ConnectorSettings, SyncItem } from '../sync/models';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'da-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent {
  step = 0;
  sourceId = '';
  query = '';
  triggerSearch = new Subject();
  resources: Observable<SyncItem[]> = this.triggerSearch.pipe(
    switchMap(() => this.sync.sources[this.sourceId].getFiles(this.query)),
  );
  selection = new SelectionModel<SyncItem>(true, []);
  kbs = this.sdk.nuclia.db
    .getAccounts()
    .pipe(
      switchMap((accounts) =>
        forkJoin(
          accounts
            .map((account) => account.slug)
            .map((account) => this.sdk.nuclia.db.getKnowledgeBoxes(account).pipe(map((kbs) => ({ account, kbs })))),
        ),
      ),
    );

  constructor(
    private route: ActivatedRoute,
    private sync: SyncService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.params
      .pipe(
        map((res) => res.id),
        filter((id) => !!id),
        take(1),
      )
      .subscribe((id) => {
        this.sourceId = id;
        this.triggerSearch.next(id);
      });
  }

  next() {
    this.step++;
    this.cdr.detectChanges();
  }

  selectSource(event: { connector: ISourceConnector; setings?: ConnectorSettings }) {
    this.sourceId = event.connector.id;
    this.next();
  }

  selectDestination(event: { connector: ISourceConnector; settings?: ConnectorSettings }) {
    this.sync.addSync({
      source: this.sourceId,
      destination: {
        id: event.connector.id,
        settings: event.settings,
      },
      files: this.selection.selected,
    });
  }
}
