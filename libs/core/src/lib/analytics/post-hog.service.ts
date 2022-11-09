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
}
