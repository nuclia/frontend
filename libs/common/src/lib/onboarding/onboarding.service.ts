import { Injectable } from '@angular/core';
import { OnboardingPayload, OnboardingStatus } from './onboarding.models';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { SDKService, STFUtils, UserService, GETTING_STARTED_DONE_KEY, NavigationService } from '@flaps/core';
import * as Sentry from '@sentry/angular';
import { SisToastService } from '@nuclia/sistema';
import { Router } from '@angular/router';
import { Account, KnowledgeBoxCreation, RetrievalAgentCreation } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private _onboardingStep: BehaviorSubject<number> = new BehaviorSubject<number>(1);
  private _kbCreationFailureCount = 0;
  private _onboardingState = new BehaviorSubject<OnboardingStatus>({
    creating: false,
    accountCreated: false,
    kbCreated: false,
    creationFailed: false,
  });

  onboardingState: Observable<OnboardingStatus> = this._onboardingState.asObservable();
  onboardingStep: Observable<number> = this._onboardingStep.asObservable();

  constructor(
    private sdk: SDKService,
    private router: Router,
    private toaster: SisToastService,
    private user: UserService,
    private navigation: NavigationService,
  ) {}

  nextStep() {
    const step = this._onboardingStep.value;
    const next = this.navigation.inRaoApp && step === 2 ? step + 2 : step + 1;
    this._onboardingStep.next(next);
  }
  previousStep() {
    const step = this._onboardingStep.value;
    if (step > 1) {
      const previous = this.navigation.inRaoApp && step === 4 ? step - 2 : step - 1;
      this._onboardingStep.next(previous);
    }
  }

  saveOnboardingInquiry(payload: OnboardingPayload) {
    this.sdk.nuclia.rest
      .put<void>(`/user/onboarding_inquiry`, payload)
      .pipe(
        catchError((error) => {
          // onboarding_inquiry should never raise any error, but if so we only catch it and log it
          console.warn(`Problem while saving onboarding inquiry:`, error);
          return of(undefined);
        }),
      )
      .subscribe();
  }

  createAccount(company: string): Observable<Account> {
    const accountSlugRequested = STFUtils.generateSlug(company);
    this._onboardingState.next({
      creating: true,
      accountCreated: false,
      kbCreated: false,
      creationFailed: false,
    });
    return this.getAvailableAccountSlug(accountSlugRequested).pipe(
      switchMap((accountSlug) =>
        this.sdk.nuclia.db
          .createAccount({
            slug: accountSlug,
            title: company,
          })
          .pipe(
            catchError((error) => {
              this._onboardingState.next({
                creating: false,
                accountCreated: false,
                kbCreated: false,
                creationFailed: true,
              });
              console.error(`Account creation failed`, error);
              this.toaster.error('Account creation failed');
              throw error;
            }),
          ),
      ),
      switchMap((account) => this.user.updateWelcome().pipe(map(() => account))),
      switchMap((account) => this.sdk.nuclia.db.getAccount(account.id)),
      tap(() => {
        this._onboardingState.next({
          creating: false,
          accountCreated: true,
          kbCreated: false,
          creationFailed: false,
        });
      }),
    );
  }

  createKb(
    accountSlug: string,
    accountId: string,
    kbConfig: KnowledgeBoxCreation,
    zone: string,
  ): Observable<{ accountSlug: string; kbSlug: string }> {
    this._onboardingState.next({
      creating: true,
      accountCreated: true,
      kbCreated: false,
      creationFailed: false,
    });
    return this.sdk.nuclia.db.createKnowledgeBox(accountId, kbConfig, zone).pipe(
      map(() => ({ accountSlug, kbSlug: kbConfig.slug })),
      catchError((error) => {
        if (error.status >= 400 && error.status < 500) {
          this.manageCreationError(
            accountSlug,
            `KB creation failed: ${error.status} ${error.body?.detail || 'Bad request'}`,
          );
          throw error;
        } else {
          this._kbCreationFailureCount += 1;
          if (this._kbCreationFailureCount < 5) {
            return this.createKb(accountSlug, accountId, kbConfig, zone);
          } else {
            this.manageCreationError(accountSlug, `KB creation failed`);
            throw error;
          }
        }
      }),
      tap(({ accountSlug, kbSlug }) => {
        this._onboardingState.next({
          creating: true,
          accountCreated: true,
          kbCreated: true,
          creationFailed: false,
        });
        this.sdk.nuclia.options.backend;
        window.location.href = `${this.sdk.getOriginFor('rag')}/at/${accountSlug}/${kbConfig.zone}/${kbSlug}`;
      }),
    );
  }

  createRao(
    accountSlug: string,
    accountId: string,
    config: RetrievalAgentCreation,
    zone: string,
  ): Observable<{ accountSlug: string; raoSlug: string }> {
    this._onboardingState.next({
      creating: true,
      accountCreated: true,
      kbCreated: false,
      creationFailed: false,
    });
    return this.sdk.nuclia.db.createRetrievalAgent(accountId, config, zone).pipe(
      map(() => ({ accountSlug, raoSlug: config.slug })),
      catchError((error) => {
        if (error.status >= 400 && error.status < 500) {
          this.manageCreationError(
            accountSlug,
            `RAO creation failed: ${error.status} ${error.body?.detail || 'Bad request'}`,
          );
          throw error;
        } else {
          this._kbCreationFailureCount += 1;
          if (this._kbCreationFailureCount < 5) {
            return this.createRao(accountSlug, accountId, config, zone);
          } else {
            this.manageCreationError(accountSlug, `RAO creation failed`);
            throw error;
          }
        }
      }),
      tap(({ accountSlug, raoSlug }) => {
        this._onboardingState.next({
          creating: true,
          accountCreated: true,
          kbCreated: true,
          creationFailed: false,
        });
        window.location.href = `${this.sdk.getOriginFor('rao')}/at/${accountSlug}/${zone}/arag/${raoSlug}`;
      }),
    );
  }

  private manageCreationError(accountSlug: string, message: string) {
    Sentry.captureMessage(message, { tags: { host: location.hostname } });
    this.toaster.error(this.navigation.inRaoApp ? 'onboarding.rao-creation.failed' : 'onboarding.kb-creation.failed');
    this._onboardingState.next({
      creating: false,
      accountCreated: true,
      kbCreated: false,
      creationFailed: true,
    });
    // creation failed but account creation worked, so we redirect to account management page to unblock people
    const path = `/at/${accountSlug}`;
    localStorage.setItem(GETTING_STARTED_DONE_KEY, 'false');
    this.router.navigate([path]);
  }

  getAvailableAccountSlug(slug: string): Observable<string> {
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
    return isNaN(existingIncrement)
      ? `${slug}_1`
      : `${slug.slice(0, -1 - `${existingIncrement}`.length)}_${existingIncrement + 1}`;
  }
}
