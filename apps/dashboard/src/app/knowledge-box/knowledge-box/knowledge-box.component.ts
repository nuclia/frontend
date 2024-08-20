import { Component, OnInit, OnDestroy } from '@angular/core';
import { distinctUntilKeyChanged, forkJoin, Subject, switchMap, take, takeUntil } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { FeaturesService, SDKService } from '@flaps/core';
import { GETTING_STARTED_DONE_KEY } from '@nuclia/user';
import { GettingStartedComponent } from '../../onboarding/getting-started/getting-started.component';
import { WelcomeInExistingKBComponent } from '../../onboarding/welcome-in-existing-kb/welcome-in-existing-kb.component';
import { SearchWidgetStorageService } from '@flaps/common';

@Component({
  template: '<router-outlet></router-outlet>',
})
export class KnowledgeBoxComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  constructor(
    private sdk: SDKService,
    private features: FeaturesService,
    private modalService: SisModalService,
    private searchWidgetStorage: SearchWidgetStorageService,
  ) {}

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        distinctUntilKeyChanged('id'),
        switchMap(() => this.searchWidgetStorage.migrateConfigsAndWidgets()),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();

    const gettingStartedDone = localStorage.getItem(GETTING_STARTED_DONE_KEY) === 'true';
    if (!gettingStartedDone) {
      forkJoin([this.sdk.counters.pipe(take(1)), this.features.isKbAdmin.pipe(take(1))]).subscribe(
        ([counters, isKbAdmin]) => {
          if (counters.resources === 0 && isKbAdmin) {
            this.modalService.openModal(GettingStartedComponent);
          } else if (!isKbAdmin) {
            this.modalService.openModal(WelcomeInExistingKBComponent);
          }
        },
      );
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
