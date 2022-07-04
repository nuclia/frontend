import { DeprecatedApiService } from '@flaps/core';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ZoneAdd, Zone, ZoneSummary, ZonePatch } from '../models/zone.model';

const STF_ZONES = '/manage/@zones';
const STF_ZONE = '/manage/@zone';

@Injectable({
  providedIn: 'root',
})
export class ZoneService {
  constructor(private api: DeprecatedApiService) {}

  getZones(): Observable<ZoneSummary[]> {
    return this.api.get(STF_ZONES, true, undefined, true);
  }

  getZone(zoneId: string): Observable<Zone> {
    return this.api.get(STF_ZONE + '/' + zoneId, true, undefined, true);
  }

  create(zone: ZoneAdd) {
    return this.api.post(STF_ZONES, zone, true, undefined, undefined, true);
  }

  edit(zoneId: string, zone: ZonePatch) {
    return this.api.patch(STF_ZONE + '/' + zoneId, zone, true, undefined, true);
  }

  delete(zoneId: string) {
    return this.api.delete(STF_ZONE + '/' + zoneId, true, true);
  }
}
