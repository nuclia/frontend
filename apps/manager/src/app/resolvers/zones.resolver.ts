import { Injectable } from '@angular/core';
import { Router, Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ZoneSummary } from '../models/zone.model';
import { ZoneService } from '../services/zone.service';

@Injectable()
export class ZonesResolve implements Resolve<ZoneSummary[]> {
  constructor(private zoneService: ZoneService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<ZoneSummary[]> {
    return this.zoneService.getZones();
  }
}