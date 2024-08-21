import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationStart } from '@angular/router';
import { SDKService } from '../api';
import { BackendConfigurationService } from '../config';
import { filter } from 'rxjs';
import { PostHogService } from './post-hog.service';

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
}
