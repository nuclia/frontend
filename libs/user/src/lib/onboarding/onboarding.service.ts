import { Injectable } from '@angular/core';
import { OnboardingPayload } from './onboarding.models';
import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { SDKService, STFTrackingService, STFUtils, UserService } from '@flaps/core';
import { WelcomeUser } from '@nuclia/core';
import * as Sentry from '@sentry/angular';
import { SisToastService } from '@nuclia/sistema';
import { Router } from '@angular/router';

export interface OnboardingStatus {
  creating: boolean;
  accountCreated: boolean;
  kbCreated: boolean;
  creationFailed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private kbCreationFailureCount = 0;
  private _onboardingState = new BehaviorSubject<OnboardingStatus>({
    creating: false,
    accountCreated: false,
    kbCreated: false,
    creationFailed: false,
  });

  onboardingState: Observable<OnboardingStatus> = this._onboardingState.asObservable();

  constructor(
    private sdk: SDKService,
    private router: Router,
    private userService: UserService,
    private tracking: STFTrackingService,
    private toaster: SisToastService,
  ) {}

  startOnboarding(payload: OnboardingPayload, zoneId: string) {
    this.kbCreationFailureCount = 0;
    this._onboardingState.next({ creating: true, accountCreated: false, kbCreated: false, creationFailed: false });

    // onboarding_inquiry is quite slow and not blocking us for creating the account, so running those in parallel
    this.sdk.nuclia.rest
      .put(`/user/onboarding_inquiry`, payload)
      .pipe(
        catchError((error) => {
          // onboarding_inquiry should never raise any error, but if so we only catch it and log it
          console.warn(`Problem while saving onboarding inquiry:`, error);
          return of(null);
        }),
      )
      .subscribe();
    this.userService.userPrefs
      .pipe(
        filter((userPrefs) => !!userPrefs),
        map((userInfo) => userInfo as WelcomeUser),
        take(1),
        switchMap((userInfo: WelcomeUser) => {
          const username = userInfo.name || userInfo.email.split('@')[0];
          const slug = STFUtils.generateSlug(username);
          return this.getAvailableAccountSlug(slug).pipe(map((availableSlug) => ({ slug: availableSlug, username })));
        }),
        switchMap(({ slug, username }) => {
          const accountData = {
            slug,
            title: `${username}'s account`,
            zone: zoneId,
          };
          this.tracking.logEvent('account_creation_submitted');
          return this.sdk.nuclia.db.createAccount(accountData).pipe(map(() => ({ accountSlug: slug })));
        }),
        catchError((error: Response) => {
          this.tracking.logEvent('account_creation_failed');
          this._onboardingState.next({
            creating: false,
            accountCreated: false,
            kbCreated: false,
            creationFailed: true,
          });
          // FIXME: find a way to retrieve details returned from the backend
          this.toaster.error('Account creation failed');
          throw error;
        }),
        switchMap(({ accountSlug }) =>
          this.sdk.nuclia.rest.getZones().pipe(
            map((zones) => {
              const zoneSlug = zones[zoneId];
              return { zoneSlug, accountSlug };
            }),
          ),
        ),
        switchMap(({ accountSlug, zoneSlug }) => {
          this._onboardingState.next({ creating: true, accountCreated: true, kbCreated: false, creationFailed: false });
          return this.createKb(accountSlug, zoneId).pipe(
            map(({ accountSlug, kbSlug }) => ({ accountSlug, kbSlug, zoneSlug })),
          );
        }),
        tap(() => {
          this._onboardingState.next({ creating: true, accountCreated: true, kbCreated: true, creationFailed: false });
          this.tracking.logEvent('account_creation_success');
        }),
      )
      .subscribe(({ accountSlug, kbSlug, zoneSlug }) => {
        this.router.navigate([`/at/${accountSlug}/${zoneSlug}/${kbSlug}/resources/dataset`]);
      });
  }

  private createKb(accountSlug: string, zoneId: string): Observable<{ accountSlug: string; kbSlug: string }> {
    const kbSlug = 'basic';
    const kbData = {
      slug: kbSlug,
      zone: zoneId,
      title: 'Basic',
    };
    return this.sdk.nuclia.db.createKnowledgeBox(accountSlug, kbData).pipe(
      catchError((error) => {
        this.tracking.logEvent('account_creation_kb_failed');
        this.kbCreationFailureCount += 1;
        if (this.kbCreationFailureCount < 5) {
          return this.createKb(accountSlug, zoneId);
        } else {
          Sentry.captureMessage(`KB creation failed`, { tags: { host: location.hostname } });
          this.toaster.error('stash.create.failure');
          this._onboardingState.next({ creating: false, accountCreated: true, kbCreated: false, creationFailed: true });
          throw error;
        }
      }),
      map(() => ({ accountSlug, kbSlug })),
    );
  }

  private getAvailableAccountSlug(slug: string): Observable<string> {
    return this.sdk.nuclia.db.getAccountStatus(slug).pipe(
      switchMap((status) => {
        if (status.available) {
          return of(slug);
        } else {
          return this.getAvailableAccountSlug(this.getIncrementedSlug(slug));
        }
      }),
    );
  }

  private getIncrementedSlug(slug: string): string {
    const existingIncrement = parseInt(slug.split('_').pop() || '');
    return isNaN(existingIncrement) ? `${slug}_1` : `${slug.slice(0, -1)}_${existingIncrement + 1}`;
  }
}
