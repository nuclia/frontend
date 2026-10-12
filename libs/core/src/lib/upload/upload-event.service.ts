import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadEventService {
  private _processingStarted = new BehaviorSubject<boolean>(false);
  private _searchPerformed = new BehaviorSubject<boolean>(false);
  private _onboardingActive = new BehaviorSubject<boolean>(false);
  // Persists across navigation: set once a successful upload completes while onboarding is
  // active, so the post-upload banner isn't tied to any single page's lifetime.
  private _showOnboardingBanner = new BehaviorSubject<boolean>(false);

  processingStarted$ = this._processingStarted.asObservable();
  searchPerformed$ = this._searchPerformed.asObservable();
  onboardingActive$ = this._onboardingActive.asObservable();
  showOnboardingBanner$ = this._showOnboardingBanner.asObservable();

  setOnboardingActive(active: boolean): void {
    this._onboardingActive.next(active);
    if (!active) {
      // Onboarding finished or was skipped: the banner is no longer relevant.
      this._showOnboardingBanner.next(false);
    }
  }

  notifyProcessingStarted(): void {
    this._processingStarted.next(true);
  }

  clearProcessingStarted(): void {
    this._processingStarted.next(false);
  }

  notifySearchPerformed(): void {
    this._searchPerformed.next(true);
  }

  clearSearchPerformed(): void {
    this._searchPerformed.next(false);
  }

  showOnboardingBanner(): void {
    if (this._onboardingActive.getValue()) {
      this._showOnboardingBanner.next(true);
    }
  }

  dismissOnboardingBanner(): void {
    this._showOnboardingBanner.next(false);
  }
}
