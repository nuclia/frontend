import { Injectable } from '@angular/core';
import { Zone } from '../models';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { FeatureFlagService } from '../analytics/feature-flag.service';
import { SDKService } from './sdk.service';
import { UserService } from './user.service';
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
    private userService: UserService,
    private billingService: BillingService,
  ) {}

  getZones(includeZonesBlocked = false): Observable<Zone[]> {
    let isNucliaBetaTester = false;
    return forkJoin([this.sdk.nuclia.rest.get<Zone[]>(`/${ZONES}`), this.userService.userInfo.pipe(take(1))]).pipe(
      switchMap(([zones, userInfo]) => {
        isNucliaBetaTester = !!userInfo?.preferences.email.includes('@nuclia.com');
        return this.featureFlagService.getFeatureBlocklist('zones').pipe(
          map((blocklist) => {
            if (isNucliaBetaTester) {
              return zones;
            } else {
              return includeZonesBlocked
                ? zones.map((zone) => ({
                    ...zone,
                    notAvailableYet: blocklist.includes(zone.slug),
                  }))
                : zones.filter((zone) => !blocklist.includes(zone.slug));
            }
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
              ? this.billingService.getSubscription().pipe(
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
