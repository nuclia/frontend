import { Component, OnInit } from '@angular/core';
import { forkJoin, take } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { FeaturesService, SDKService } from '@flaps/core';
import { GETTING_STARTED_DONE_KEY } from '@nuclia/user';
import { GettingStartedComponent } from '../../onboarding/getting-started/getting-started.component';
import { WelcomeInExistingKBComponent } from '../../onboarding/welcome-in-existing-kb/welcome-in-existing-kb.component';

@Component({
  template: '<router-outlet></router-outlet>',
})
export class KnowledgeBoxComponent implements OnInit {
  constructor(
    private sdk: SDKService,
    private features: FeaturesService,
    private modalService: SisModalService,
  ) {}

  ngOnInit() {
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
}
