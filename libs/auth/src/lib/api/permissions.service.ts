import { APIService } from '../api.service';
import { Injectable } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Permissions, UsersList } from '../models/permissions.model';
import { EMPTY } from 'rxjs';

const STF_PERMISSIONS = '/@permissions';
const STF_USERS = '/@users';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  constructor(private api: APIService) {}

  getUsers(url: string): Observable<UsersList> {
    return this.api.get(url + STF_USERS, true, undefined).pipe(
      map((res) => new UsersList(res.users)),
      catchError((err, caught) => {
        if (err.status === 401) {
          return EMPTY;
        }
        return EMPTY;
      })
    );
  }

  getRoles(url: string): Observable<Permissions> {
    return this.api.get(url + STF_PERMISSIONS, true, undefined).pipe(
      map((res) => new Permissions(res.permissions)),
      catchError((err, caught) => {
        if (err.status === 401) {
          return EMPTY;
        }
        return EMPTY;
      })
    );
  }
}
