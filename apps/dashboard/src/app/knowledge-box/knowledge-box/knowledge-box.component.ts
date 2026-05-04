import { Component, OnDestroy, OnInit } from '@angular/core';
import { FeaturesService, SDKService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { catchError, distinctUntilKeyChanged, filter, map, of, Subject, switchMap, take, takeUntil } from 'rxjs';
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
    private toaster: SisToastService,
  ) {}

  ngOnInit() {
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
          serviceAccounts.some((serviceAccount) =>
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
    this.sdk.currentKb
      .pipe(
        takeUntil(this.unsubscribeAll),
        distinctUntilKeyChanged('id'),
        filter((kb) => !!kb.allowed_ip_addresses),
        switchMap((kb) =>
          // Make an arbitrary request to check if the current IP is blocked
          kb.counters().pipe(
            catchError((error) => {
              if (error?.body?.detail?.startsWith('Access denied due to Knowledgebox IP whitelisting rules')) {
                this.toaster.error('kb.form.allowed-ips.blocked');
              }
              return of(undefined);
            }),
          ),
        ),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
