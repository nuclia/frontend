import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Welcome } from '@nuclia/core';
import { SDKService } from './sdk.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  isBrowser = false;
  private userInfoSubject = new BehaviorSubject<Welcome | undefined>(undefined);
  readonly userInfo = this.userInfoSubject.asObservable();
  readonly userPrefs = this.userInfoSubject.pipe(map((user) => user?.preferences));

  constructor(private sdk: SDKService, @Inject(PLATFORM_ID) platformId: any) {
    this.isBrowser = isPlatformBrowser(platformId);

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
        if (error.status === 403 || error.status === 400) {
          this.sdk.nuclia.auth.logout();
        }
        return of(error);
      }),
      map((welcome) => {
        this.userInfoSubject.next(welcome);
      }),
    );
  }

  getUserinfo(): Welcome | undefined {
    return this.userInfoSubject.getValue();
  }
}
