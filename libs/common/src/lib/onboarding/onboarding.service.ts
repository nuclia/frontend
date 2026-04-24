import { Injectable } from '@angular/core';
import { OnboardingPayload, OnboardingStatus } from './onboarding.models';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';
import {
  SDKService,
  STFUtils,
  UserService,
  GETTING_STARTED_DONE_KEY,
  NavigationService,
  AuthService,
  FeaturesService,
} from '@flaps/core';
import * as Sentry from '@sentry/angular';
import { SisToastService } from '@nuclia/sistema';
import { Router } from '@angular/router';
import { Account, AccountModification, KnowledgeBoxCreation, RetrievalAgentCreation } from '@nuclia/core';

const CLASSIC_STEPS = [1, 3, 4, 5, 6];
const COWORK_STEPS = [1, 2, 4, 5, 6];
const PRESET_COWORK_STEPS = [1, 4, 5, 6];
@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private _onboardingStep: BehaviorSubject<number> = new BehaviorSubject<number>(1);
  private _onboardingState = new BehaviorSubject<OnboardingStatus>({
    creating: false,
    accountCreated: false,
    kbCreated: false,
    creationFailed: false,
  });

  onboardingState: Observable<OnboardingStatus> = this._onboardingState.asObservable();
  onboardingStep: Observable<number> = this._onboardingStep.asObservable();

  dashboardSteps = this.features.unstable.coworkAccount.pipe(
    map((coworkEnabled) => (coworkEnabled ? COWORK_STEPS : CLASSIC_STEPS)),
  );
  raoSteps = of([1, 3, 5, 6]);

  constructor(
    private sdk: SDKService,
    private router: Router,
    private toaster: SisToastService,
    private user: UserService,
    private navigation: NavigationService,
    private features: FeaturesService,
    private authService: AuthService,
  ) {}

  nextStep() {
    (this.navigation.inRaoApp ? this.raoSteps : this.dashboardSteps).pipe(take(1)).subscribe((steps) => {
      const step = this._onboardingStep.value;
      const next = steps[steps.findIndex((s) => s === step) + 1];
      this._onboardingStep.next(next);
    });
  }
  previousStep() {
    (this.navigation.inRaoApp ? this.raoSteps : this.dashboardSteps).pipe(take(1)).subscribe((steps) => {
      const step = this._onboardingStep.value;
      if (step > 1) {
        const previous = steps[steps.findIndex((s) => s === step) - 1];
        this._onboardingStep.next(previous);
      }
    });
  }

  switchToPreset() {
    this.dashboardSteps = of(PRESET_COWORK_STEPS);
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

  createAccount(): Observable<Account> {
    this._onboardingState.next({
      creating: true,
      accountCreated: false,
      kbCreated: false,
      creationFailed: false,
    });
    const signupToken = this.authService.getSignUpToken();
    if (!signupToken) {
      this._onboardingState.next({
        creating: false,
        accountCreated: false,
        kbCreated: false,
        creationFailed: true,
      });
      console.error('No signup data');
      throw new Error('No signup data');
      // redirect to sign up form
      location.href = 'https://www.progress.com/agentic-rag';
    } else {
      return this.sdk.nuclia.db.getSignupInfo(signupToken).pipe(
        switchMap((data) =>
          this.getAvailableAccountSlug(STFUtils.generateSlug(data.company)).pipe(
            switchMap((accountSlug) =>
              this.sdk.nuclia.db
                .createAccount({
                  slug: accountSlug,
                  title: data.company,
                  workflow: data.workflow,
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
  }

  modifyAccount(accountSlug: string, data: AccountModification): Observable<void> {
    return this.sdk.nuclia.db.modifyAccount(accountSlug, data);
  }

  createKb(
    accountSlug: string,
    accountId: string,
    kbConfig: KnowledgeBoxCreation,
    zone: string,
    failCount = 0,
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
          failCount += 1;
          if (failCount < 5) {
            return this.createKb(accountSlug, accountId, kbConfig, zone, failCount);
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
        window.location.href = `${this.sdk.getOriginForApp('rag')}/at/${accountSlug}/${kbConfig.zone}/${kbSlug}`;
      }),
    );
  }

  createRao(
    accountSlug: string,
    accountId: string,
    config: RetrievalAgentCreation,
    zone: string,
    failCount = 0,
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
          failCount += 1;
          if (failCount < 5) {
            return this.createRao(accountSlug, accountId, config, zone, failCount);
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
        window.location.href = `${this.sdk.getOriginForApp('rao')}/at/${accountSlug}/${zone}/arag/${raoSlug}`;
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
