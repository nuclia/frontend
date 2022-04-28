import { Injectable } from '@angular/core';
import { Router, Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ZoneService } from '../services/zone.service';
import { Zone } from '../models/zone.model';

@Injectable()
export class ZoneResolve implements Resolve<Zone | null> {
  constructor(private zoneService: ZoneService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Zone | null> {
    const zoneId = route.paramMap.get('zone');
    if (zoneId) {
      return this.zoneService.getZone(zoneId);
    }
    else {
      return of(null);
    }
  }
}
