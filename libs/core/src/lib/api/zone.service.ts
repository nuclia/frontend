import { Injectable } from '@angular/core';
import { Zone } from '../models';
import { map, Observable, switchMap } from 'rxjs';
import { FeatureFlagService } from '../analytics/feature-flag.service';
import { SDKService } from './sdk.service';

const VERSION = 'v1';
const ZONES = 'zones';

@Injectable({
  providedIn: 'root',
})
export class ZoneService {
  constructor(
    private sdk: SDKService,
    private featureFlagService: FeatureFlagService,
  ) {}

  getZones(includeZonesBlocked = false): Observable<Zone[]> {
    return this.sdk.nuclia.rest.get<Zone[]>(`/${ZONES}`).pipe(
      switchMap((zones) =>
        this.featureFlagService.getFeatureBlocklist('zones').pipe(
          map((blocklist) => {
            return includeZonesBlocked
              ? zones.map((zone) => ({
                  ...zone,
                  notAvailableYet: blocklist.includes(zone.slug),
                }))
              : zones.filter((zone) => !blocklist.includes(zone.slug));
          }),
        ),
      ),
    );
  }
}
