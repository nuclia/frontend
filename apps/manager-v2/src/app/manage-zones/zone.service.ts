import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { BehaviorSubject, filter, map, Observable, take, tap } from 'rxjs';
import { Zone, ZoneAddPayload, ZonePatchPayload, ZoneSummary } from './zone.models';

const ZONES_ENDPOINT = '/manage/@zones';
const ZONE_ENDPOINT = '/manage/@zone';

@Injectable({
  providedIn: 'root',
})
export class ZoneService {
  private _zones = new BehaviorSubject<ZoneSummary[]>([]);
  zones = this._zones.asObservable();

  constructor(private sdk: SDKService) {
    this.loadZones().subscribe();
  }

  loadZones(): Observable<ZoneSummary[]> {
    return this.sdk.nuclia.rest.get<ZoneSummary[]>(ZONES_ENDPOINT).pipe(tap((zones) => this._zones.next(zones)));
  }

  /**
   * Get a map of zone slug indexed by their id
   */
  getZoneDict(): Observable<{ [zoneId: string]: ZoneSummary }> {
    return this.zones.pipe(
      filter((zones) => zones.length > 0),
      take(1),
      map((zones) =>
        zones.reduce(
          (map, zone) => {
            map[zone.id] = zone;
            return map;
          },
          {} as { [zoneId: string]: ZoneSummary },
        ),
      ),
    );
  }

  /**
   * Get Zone slug corresponding to zone id provided
   * @param zoneId
   */
  getZoneSlug(zoneId: string): Observable<string | undefined> {
    return this.getZoneDict().pipe(map((zoneSlugs) => zoneSlugs[zoneId].slug));
  }

  getZone(zoneId: string): Observable<Zone> {
    return this.sdk.nuclia.rest.get(`${ZONE_ENDPOINT}/${zoneId}`);
  }

  addZone(zone: ZoneAddPayload): Observable<string> {
    return this.sdk.nuclia.rest.post<Zone & { token: string }>(ZONES_ENDPOINT, zone).pipe(map((zone) => zone.token));
  }

  updateZone(zoneId: string, zone: ZonePatchPayload): Observable<void> {
    return this.sdk.nuclia.rest.patch(`${ZONE_ENDPOINT}/${zoneId}`, zone);
  }

  deleteZone(zoneId: string): Observable<void> {
    return this.sdk.nuclia.rest.delete(`${ZONE_ENDPOINT}/${zoneId}`);
  }
}
