import { Injectable } from '@angular/core';
import { DeprecatedApiService } from './deprecated-api.service';
import { Zone } from '../models';
import { Observable, map, switchMap } from 'rxjs';
import { FeatureFlagService } from '../analytics/feature-flag.service';

const VERSION = 'v1';
const ZONES = 'zones';

@Injectable({
  providedIn: 'root',
})
export class ZoneService {
  constructor(
    private api: DeprecatedApiService,
    private featureFlagService: FeatureFlagService,
  ) {}

  getZones(): Observable<Zone[]> {
    return this.api
      .get(`/${VERSION}/${ZONES}`, true, undefined, true)
      .pipe(
        switchMap((zones) =>
          this.featureFlagService
            .getFeatureBlocklist('zones')
            .pipe(map((blocklist) => (zones as Zone[]).filter((zone) => !blocklist.includes(zone.slug)))),
        ),
      );
  }
}
