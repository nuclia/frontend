import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, map, Subject, switchMap, take } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { SampleDatasetService, UploadService } from '@flaps/common';
import { SDKService } from '@flaps/core';
import { GETTING_STARTED_DONE_KEY } from '@nuclia/user';
import { GettingStartedComponent } from '../../onboarding/getting-started/getting-started.component';

@Component({
  templateUrl: './knowledge-box.component.html',
  styleUrls: ['./knowledge-box.component.scss'],
})
export class KnowledgeBoxComponent implements OnInit, OnDestroy {
  showBar = combineLatest([this.uploadService.progress, this.uploadService.barDisabled]).pipe(
    map(([progress, disabled]) => !progress.completed && !disabled),
  );
  private unsubscribeAll = new Subject<void>();

  constructor(
    private sdk: SDKService,
    private uploadService: UploadService,
    private modalService: SisModalService,
    private sampleDatasetService: SampleDatasetService,
  ) {}

  ngOnInit() {
    const gettingStartedDone = localStorage.getItem(GETTING_STARTED_DONE_KEY) === 'true';
    if (!gettingStartedDone) {
      this.sdk.counters
        .pipe(
          take(1),
          switchMap((counters) =>
            this.sampleDatasetService
              .hasOnlySampleResources(counters)
              .pipe(map((hasOnlySample) => ({ counters, hasOnlySample }))),
          ),
        )
        .subscribe(({ counters, hasOnlySample }) => {
          if (counters.resources === 0) {
            this.modalService.openModal(GettingStartedComponent);
          } else if (!hasOnlySample) {
            localStorage.setItem(GETTING_STARTED_DONE_KEY, 'true');
          }
        });
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
