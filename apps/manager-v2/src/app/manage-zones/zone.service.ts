import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Observable } from 'rxjs';
import { Zone, ZoneAddPayload, ZonePatchPayload, ZoneSummary } from './zone.models';

const ZONES_ENDPOINT = '/manage/@zones';
const ZONE_ENDPOINT = '/manage/@zone';

@Injectable({
  providedIn: 'root',
})
export class ZoneService {
  constructor(private sdk: SDKService) {}

  getZones(): Observable<ZoneSummary[]> {
    return this.sdk.nuclia.rest.get(ZONES_ENDPOINT);
  }

  getZone(zoneId: string): Observable<Zone> {
    return this.sdk.nuclia.rest.get(`${ZONE_ENDPOINT}/${zoneId}`);
  }

  addZone(zone: ZoneAddPayload): Observable<void> {
    return this.sdk.nuclia.rest.post(ZONES_ENDPOINT, zone);
  }

  updateZone(zoneId: string, zone: ZonePatchPayload): Observable<void> {
    return this.sdk.nuclia.rest.patch(`${ZONE_ENDPOINT}/${zoneId}`, zone);
  }

  deleteZone(zoneId: string): Observable<void> {
    return this.sdk.nuclia.rest.delete(`${ZONE_ENDPOINT}/${zoneId}`);
  }
}
