import { Injectable } from '@angular/core';
import { Zone } from '../models';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { FeatureFlagService } from '../analytics/feature-flag.service';
import { SDKService } from './sdk.service';
import { UserService } from './user.service';
import { take } from 'rxjs/operators';

const VERSION = 'v1';
const ZONES = 'zones';

@Injectable({
  providedIn: 'root',
})
export class ZoneService {
  constructor(
    private sdk: SDKService,
    private featureFlagService: FeatureFlagService,
    private userService: UserService,
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
    );
  }
}
