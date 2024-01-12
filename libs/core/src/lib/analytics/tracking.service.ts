import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationStart } from '@angular/router';
import { SDKService } from '../api';
import { BackendConfigurationService } from '../config';
import { filter, Observable } from 'rxjs';
import { PostHogService } from './post-hog.service';

const STATUS_ALERT = 'NUCLIA_STATUS_ALERT';
const ANNOUNCE = 'NUCLIA_ANNOUNCE';
@Injectable({
  providedIn: 'root',
})
export class STFTrackingService {
  isBrowser = false;

  constructor(
    private config: BackendConfigurationService,
    private sdk: SDKService,
    private postHogService: PostHogService,
  ) {
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

  /**
   * Log event in PostHog by calling `postHogService.logEvent`.
   * Kept for backward compatibility.
   * @param event
   * @param properties
   */
  logEvent(event: string, properties?: { [key: string]: string }) {
    this.postHogService.logEvent(event, properties);
  }

  navigation(event: NavigationEnd | NavigationStart) {
    if (this.sdk.nuclia.auth.getJWTUser()) {
      this.postHogService.logEvent('visited', {
        page_path: event.url,
      });
    } else {
      this.postHogService.logEvent('public', {
        page_path: event.url,
      });
    }
  }

  login(email: string) {
    this.postHogService.init(email);
  }

  logout() {
    this.postHogService.reset();
  }

  getStatusMessage(alert: boolean): Observable<string> {
    const localStorageKey = alert ? STATUS_ALERT : ANNOUNCE;
    const path = `https://nuclia.github.io/status/${alert ? 'status' : 'announce'}.json`;
    return new Observable<string>((observer) => {
      const lastMessage = parseInt(localStorage.getItem(localStorageKey) || '0', 10);
      fetch(path)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.active && data.id > lastMessage) {
            observer.next(data.message);
            localStorage.setItem(localStorageKey, data.id.toString());
          } else {
            observer.next('');
          }
        });
    });
  }
}
