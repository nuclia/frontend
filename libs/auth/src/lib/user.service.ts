import { EventEmitter, Inject, Output, Injectable, PLATFORM_ID } from '@angular/core';
import { Location, PlatformLocation } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserPreferences, User } from './models';
import { AuthService } from './auth.service';
import { BehaviorSubject, catchError, filter, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Welcome } from '@nuclia/core';
import { SDKService } from './sdk.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  isBrowser = false;

  @Output() loggedout = new EventEmitter<string | null>();

  private userInfoSubject = new BehaviorSubject<Welcome | undefined>(undefined);

  readonly userPrefs = this.userInfoSubject.pipe(map((user) => user?.preferences));

  constructor(
    public http: HttpClient,
    public platformLocation: PlatformLocation,
    public location: Location,
    private authService: AuthService,
    private sdk: SDKService,
    @Inject(PLATFORM_ID) platformId: any,
  ) {
    // check if there is local creds
    this.isBrowser = isPlatformBrowser(platformId);

    this.loggedout.subscribe(() => {
      this.authService.removeLocalCreds();
    });

    this.authService.expired.subscribe(() => {
      this.logout();
    });

    this.sdk.nuclia.auth
      .isAuthenticated()
      .pipe(
        filter((yes) => yes),
        switchMap(() => this.updateWelcome()),
      )
      .subscribe();
  }

  createHeaders(auth = true): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');
    if (auth) {
      let auth_header = '';
      auth_header = 'Bearer ' + this.authService.getToken();
      headers = headers.set('Authorization', auth_header);
    }
    return headers;
  }

  private updateWelcome(): Observable<void> {
    const mockUser = { avatar: '', email: '', id: '', name: '', type: 'USER' } as User;
    return forkJoin({
      welcome: this.sdk.nuclia.db.getWelcome(),
      me: of(mockUser),
    }).pipe(
      map((res) => {
        res.welcome.preferences = new UserPreferences(res.welcome.preferences, res.me);
        this.userInfoSubject.next(res.welcome);
      }),
      catchError(() => {
        this.loggedout.emit();
        console.log('Failes to get Welcome');
        return of(undefined);
      }),
    );
  }

  getUserinfo(): Welcome | undefined {
    return this.userInfoSubject.getValue();
  }

  logout() {
    this.sdk.nuclia.auth.logout();
    if (this.isBrowser) {
      this.authService.clear();
    }
    this.loggedout.emit();
  }
}
