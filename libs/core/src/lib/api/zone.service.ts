import { Injectable } from '@angular/core';
import { Zone } from '../models';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { FeatureFlagService } from '../analytics/feature-flag.service';
import { SDKService } from './sdk.service';
import { take } from 'rxjs/operators';
import { BillingService } from './billing.service';

const ZONES = 'zones';

@Injectable({
  providedIn: 'root',
})
export class ZoneService {
  constructor(
    private sdk: SDKService,
    private featureFlagService: FeatureFlagService,
    private billingService: BillingService,
  ) {}

  getZones(includeZonesBlocked = false): Observable<Zone[]> {
    return this.sdk.nuclia.rest.get<Zone[]>(`/${ZONES}`).pipe(
      switchMap((zones) => {
        return this.featureFlagService.getFeatureBlocklist('zones').pipe(
          map((blocklist) => {
            return includeZonesBlocked
              ? zones.map((zone) => ({
                  ...zone,
                  notAvailableYet: blocklist.includes(zone.slug),
                }))
              : zones.filter((zone) => !blocklist.includes(zone.slug));
          }),
        );
      }),
      switchMap((zones) =>
        // Keep only AWS zones on AWS_MARKETPLACE subscriptions
        // (except on stage where there is only one zone)
        this.sdk.hasAccount.pipe(
          take(1),
          switchMap((hasAccount) =>
            hasAccount
              ? this.billingService.getSubscription(true).pipe(
                  take(1),
                  map((subscription) =>
                    subscription && subscription.provider === 'AWS_MARKETPLACE' && !this.featureFlagService.isStageOrDev
                      ? zones.filter((zone) => zone.cloud_provider === 'AWS')
                      : zones,
                  ),
                  catchError(() => of(zones)),
                )
              : of(zones),
          ),
        ),
      ),
    );
  }
}
