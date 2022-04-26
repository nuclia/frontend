import { Injectable } from '@angular/core';
import { APIService } from '@flaps/auth';
import { Zone } from '../models/zone.model';
import { Observable, of } from 'rxjs';

const VERSION = 'v1';
const ZONES = 'zones';

@Injectable({
  providedIn: 'root',
})
export class ZoneService {
  constructor(private api: APIService) {}

  getZones(): Observable<Zone[]> {
    return this.api.get(`/${VERSION}/${ZONES}`, true, undefined, true);
  }
}