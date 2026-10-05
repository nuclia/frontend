import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Welcome } from '@nuclia/core';
import { BehaviorSubject, catchError, EMPTY, filter, map, Observable, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { SDKService } from './sdk.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userInfoSubject = new BehaviorSubject<Welcome | undefined>(undefined);
  readonly userInfo = this.userInfoSubject.asObservable();
  readonly userPrefs = this.userInfoSubject.pipe(map((user) => user?.preferences));
  readonly userType = this.userPrefs.pipe(map((pref) => pref?.type));
  readonly hasOwnAccount = this.userInfo.pipe(map((info) => (info?.dependant_accounts.length || 0) > 0));

  constructor(
    private sdk: SDKService,
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {
    this.sdk.nuclia.auth
      .isAuthenticated()
      .pipe(
        filter((yes) => yes),
        switchMap(() => this.updateWelcome()),
      )
      .subscribe();
  }

  updateWelcome(): Observable<void> {
    return this.sdk.nuclia.db.getWelcome().pipe(
      catchError((error) => {
        this.authService.setNextParams(this.route.snapshot.queryParams);
        this.authService.setNextUrl(new URL(window.location.href).pathname);
        if (error?.status === 401) {
          // TODO: This code is unreachable because CORS headers are missing in 401 responses
          this.sdk.nuclia.auth.logout();
        }
        return EMPTY;
      }),
      map((welcome) => {
        this.userInfoSubject.next(welcome);
      }),
    );
  }
}
