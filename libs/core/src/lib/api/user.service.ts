import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Welcome } from '@nuclia/core';
import { SDKService } from './sdk.service';
import { AuthService } from '../auth/auth.service';

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
    if (!this.sdk.nuclia.options.standalone) {
      this.sdk.nuclia.auth
        .isAuthenticated()
        .pipe(
          filter((yes) => yes),
          switchMap(() => this.updateWelcome()),
        )
        .subscribe();
    }
  }

  updateWelcome(): Observable<void> {
    return this.sdk.nuclia.db.getWelcome().pipe(
      catchError((error) => {
        if (error.status === 403 || error.status === 400) {
          this.authService.setNextParams(this.route.snapshot.queryParams);
          this.authService.setNextUrl(new URL(window.location.href).pathname);
          this.sdk.nuclia.auth.logout();
        }
        return of(error);
      }),
      map((welcome) => {
        this.userInfoSubject.next(welcome);
      }),
    );
  }
}
