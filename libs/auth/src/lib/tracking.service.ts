import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationStart } from '@angular/router';
import { APIService } from './api.service';
import { BackendConfigurationService } from './backend-config.service';
import posthog from 'posthog-js';
import { filter, Observable } from 'rxjs';
import { SDKService } from './sdk.service';

const STATUS_ALERT = 'NUCLIA_STATUS_ALERT';
@Injectable({
  providedIn: 'root',
})
export class STFTrackingService {
  splashScreenEl: any;
  isBrowser = false;

  constructor(private config: BackendConfigurationService, private apiService: APIService, private sdk: SDKService) {
    this.sdk.nuclia.auth
      .isAuthenticated()
      .pipe(filter((yes) => yes))
      .subscribe(() => {
        const user = this.sdk.nuclia.auth.getJWTUser();
        if (user) {
          this.login(user.sub);
        }
      });
    const user = this.sdk.nuclia.auth.getJWTUser();
    if (this.config.isBrowser && user) {
      this.login(user.sub);
    }
  }

  logEvent(event: string, properties?: { [key: string]: string }) {
    if (!this.config.isBrowser) return;
    posthog.capture(event, properties);
  }

  navigation(event: NavigationEnd | NavigationStart) {
    if (!this.config.isBrowser) return;
    if (this.sdk.nuclia.auth.getJWTUser()) {
      posthog.capture('visited', {
        page_path: event.url,
      });
    } else {
      posthog.capture('public', {
        page_path: event.url,
      });
    }
  }

  login(user: string) {
    if (!this.config.isBrowser) return;
    posthog.identify(user);
    // Set email or any other data
    posthog.people.set({ email: user });
  }

  logout() {
    if (!this.config.isBrowser) return;
    posthog.reset(true);
  }

  successResult(search_query: string, success: string, resource: string | undefined) {
    if (!this.config.isBrowser) return;
    posthog.capture('success', {
      search_query: search_query,
      success: success,
    });

    this.apiService
      .get(resource + '/@feedback?' + success + '=' + search_query, true, undefined, true)
      .subscribe((res) => {});
  }

  isFeatureEnabled(feature: string): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      posthog.onFeatureFlags(() => {
        observer.next(posthog.isFeatureEnabled(feature, { send_event: false }));
        observer.complete();
      });
    });
  }

  getEnabledFeatures(): Observable<string[]> {
    return new Observable<string[]>((observer) => {
      posthog.onFeatureFlags((flags) => {
        observer.next(flags);
        observer.complete();
      });
    });
  }

  getStatusAlert(): Observable<string> {
    return new Observable<string>((observer) => {
      const lastAlert = parseInt(localStorage.getItem(STATUS_ALERT) || '0', 10);
      fetch('https://nuclia.github.io/status/status.json')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.active && data.id > lastAlert) {
            observer.next(data.message);
            localStorage.setItem(STATUS_ALERT, data.id.toString());
          } else {
            observer.next('');
          }
        });
    });
  }
}
