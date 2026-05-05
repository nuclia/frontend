import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadEventService {
  private _processingStarted = new BehaviorSubject<boolean>(false);
  private _searchPerformed = new BehaviorSubject<boolean>(false);
  private _onboardingActive = new BehaviorSubject<boolean>(false);

  processingStarted$ = this._processingStarted.asObservable();
  searchPerformed$ = this._searchPerformed.asObservable();
  onboardingActive$ = this._onboardingActive.asObservable();

  setOnboardingActive(active: boolean): void {
    this._onboardingActive.next(active);
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
}
