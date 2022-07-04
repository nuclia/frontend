import { Injectable } from '@angular/core';
import posthog from 'posthog-js';
import { BackendConfigurationService } from '../config';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostHogService {
  constructor(private config: BackendConfigurationService) {}

  init(email: string) {
    if (!this.config.isBrowser) return;
    posthog.identify(email);
    // Set email or any other data
    posthog.people.set({ email });
  }

  reset() {
    if (!this.config.isBrowser) return;
    posthog.reset(true);
  }

  logEvent(event: string, properties?: { [key: string]: string }) {
    if (!this.config.isBrowser) return;
    posthog.capture(event, properties);
  }

  isFeatureEnabled(feature: string): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      posthog.onFeatureFlags(() => {
        observer.next(posthog.isFeatureEnabled(feature, { send_event: false }));
        observer.complete();
      });
    });
  }

  getFeatureFlag(feature: string): Observable<string | boolean | undefined> {
    return new Observable((observer) => {
      posthog.onFeatureFlags(() => {
        observer.next(posthog.getFeatureFlag(feature, { send_event: false }));
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
}
