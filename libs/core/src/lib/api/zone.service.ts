import { Injectable } from '@angular/core';
import { APIService } from './api.service';
import { Zone } from '../models';
import { Observable } from 'rxjs';

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
