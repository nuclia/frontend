import { SelectionModel } from '@angular/cdk/collections';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/auth';
import { forkJoin, Observable, Subject } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { Resource } from '../sync/models';
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
  resources: Observable<Resource[]> = this.triggerSearch.pipe(
    switchMap(() => this.sync.providers[this.sourceId].getFiles(this.query)),
  );
  selection = new SelectionModel<Resource>(true, []);
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

  disconnect() {
    if (this.sourceId) {
      this.sync.providers[this.sourceId].disconnect();
    }
  }

  import(account: string, kb?: string) {
    if (!kb) {
      return;
    }
    this.sync.receivers['kb'].init({ kb });
    forkJoin(
      this.selection.selected.map((selection) =>
        this.sync.providers[this.sourceId].download(selection).pipe(
          switchMap((blob) => this.sync.receivers['kb'].upload(selection.title, blob)),
          take(1),
        ),
      ),
    ).subscribe((res) => console.log(res));
  }

  next() {
    this.step++;
    this.cdr.detectChanges();
  }
}
