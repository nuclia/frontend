import { Component, OnDestroy, OnInit } from '@angular/core';
import { FeaturesService, SDKService } from '@flaps/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { GETTING_STARTED_DONE_KEY } from '@nuclia/user';
import { distinctUntilKeyChanged, filter, forkJoin, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { GettingStartedComponent } from '../../onboarding/getting-started/getting-started.component';
import { WelcomeInExistingKBComponent } from '../../onboarding/welcome-in-existing-kb/welcome-in-existing-kb.component';
import { addDays } from 'date-fns';

@Component({
  template: '<router-outlet></router-outlet>',
  standalone: false,
})
export class KnowledgeBoxComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  constructor(
    private sdk: SDKService,
    private features: FeaturesService,
    private modalService: SisModalService,
    private toaster: SisToastService,
  ) {}

  ngOnInit() {
    const gettingStartedDone = localStorage.getItem(GETTING_STARTED_DONE_KEY) === 'true';
    if (!gettingStartedDone) {
      forkJoin([this.sdk.counters.pipe(take(1)), this.features.isKbAdmin.pipe(take(1))]).subscribe(
        ([counters, isKbAdmin]) => {
          if (counters?.resources === 0 && isKbAdmin) {
            this.modalService.openModal(GettingStartedComponent);
          } else if (!isKbAdmin) {
            this.modalService.openModal(WelcomeInExistingKBComponent);
          }
        },
      );
    }
    this.sdk.currentKb
      .pipe(
        takeUntil(this.unsubscribeAll),
        distinctUntilKeyChanged('id'),
        switchMap((kb) =>
          this.features.isKbAdmin.pipe(
            take(1),
            map((isAdmin) => ({ kb, isAdmin })),
          ),
        ),
        filter(({ isAdmin }) => isAdmin),
        switchMap(({ kb }) => kb.getServiceAccounts()),
        filter((serviceAccounts) =>
          serviceAccounts.some(
            (serviceAccount) =>
              (serviceAccount.keys || [])?.some((key) => {
                const now = new Date();
                const expiration = new Date(`${key.expires}Z`);
                return expiration > now && addDays(expiration, -15) < now;
              }),
          ),
        ),
      )
      .subscribe(() => {
        this.toaster.warning('api-key-management.expiration-warning');
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
