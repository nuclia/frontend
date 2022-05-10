import { SelectionModel } from '@angular/cdk/collections';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/auth';
import { forkJoin, Observable, Subject } from 'rxjs';
import { concatMap, filter, map, switchMap, take } from 'rxjs/operators';
import { IUploadConnectorSettings, SyncItem } from '../sync/models';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'da-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceComponent {
  step = 0;
  sourceId = '';
  query = '';
  triggerSearch = new Subject();
  resources: Observable<SyncItem[]> = this.triggerSearch.pipe(
    switchMap(() => this.sync.providers[this.sourceId].getFiles(this.query)),
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

  import(kb?: string) {
    if (!kb) {
      return;
    }
    this.sync.addSync({
      provider: this.sourceId,
      receiver: {
        id: 'kb',
        settings: { kb } as IUploadConnectorSettings,
      },
      files: this.selection.selected,
    });
  }

  next() {
    this.step++;
    this.cdr.detectChanges();
  }
}
