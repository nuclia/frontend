import { Injectable } from '@angular/core';
import { GETTING_STARTED_DONE_KEY, OnboardingPayload, OnboardingStatus } from './onboarding.models';
import { BehaviorSubject, catchError, map, Observable, of, switchMap } from 'rxjs';
import {
  AccountAndKbConfiguration,
  getSemanticModel,
  SDKService,
  STFTrackingService,
  STFUtils,
  UserService,
} from '@flaps/core';
import * as Sentry from '@sentry/angular';
import { SisToastService } from '@nuclia/sistema';
import { Router } from '@angular/router';
import { KnowledgeBoxCreation } from '@nuclia/core';

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
    private tracking: STFTrackingService,
    private toaster: SisToastService,
    private user: UserService,
  ) {}

  nextStep() {
    this._onboardingStep.next(this._onboardingStep.value + 1);
  }
  previousStep() {
    const step = this._onboardingStep.value;
    if (step > 1) {
      this._onboardingStep.next(step - 1);
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

  startOnboarding(configuration: AccountAndKbConfiguration) {
    this._onboardingState.next({
      creating: true,
      accountCreated: false,
      kbCreated: false,
      creationFailed: false,
    });
    this._kbCreationFailureCount = 0;

    const accountSlugRequested = STFUtils.generateSlug(configuration.company);
    this.tracking.logEvent('account_creation_submitted');
    this.getAvailableAccountSlug(accountSlugRequested)
      .pipe(
        switchMap((accountSlug) =>
          this.sdk.nuclia.db
            .createAccount({
              slug: accountSlug,
              title: configuration.company,
            })
            .pipe(
              map((account) => {
                return { accountSlug, accountId: account.id };
              }),
              catchError((error) => {
                this.tracking.logEvent('account_creation_failed');
                this._onboardingState.next({
                  creating: false,
                  accountCreated: false,
                  kbCreated: false,
                  creationFailed: true,
                });
                // FIXME: find a way to retrieve details returned from the backend
                console.error(`Account creation failed`, error);
                this.toaster.error('Account creation failed');
                throw error;
              }),
            ),
        ),
        switchMap((account) => this.user.updateWelcome().pipe(map(() => account))),
        switchMap(({ accountSlug, accountId }) => {
          this.sdk.nuclia.options.zone = configuration.zoneSlug;
          return this.sdk.nuclia.db
            .getLearningSchema(accountId, configuration.zoneSlug)
            .pipe(map((learningConfiguration) => ({ learningConfiguration, accountSlug, accountId })));
        }),
        switchMap(({ learningConfiguration, accountSlug, accountId }) => {
          const kbConfig = {
            slug: STFUtils.generateSlug(configuration.kbName),
            title: configuration.kbName,
            learning_configuration: {
              semantic_model: getSemanticModel(configuration.semanticModel, learningConfiguration),
            },
          };
          this.tracking.logEvent('kb_creation_submitted', {
            region: configuration.zoneSlug,
            learningConfiguration: kbConfig.learning_configuration?.['semantic_model'] || '',
          });
          this._onboardingState.next({
            creating: true,
            accountCreated: true,
            kbCreated: false,
            creationFailed: false,
          });
          return this.createKb(accountSlug, accountId, kbConfig, configuration.zoneSlug);
        }),
      )
      .subscribe(({ accountSlug, kbSlug }) => {
        this._onboardingState.next({
          creating: true,
          accountCreated: true,
          kbCreated: true,
          creationFailed: false,
        });
        this.tracking.logEvent('account_creation_success');
        const path = `/at/${accountSlug}/${configuration.zoneSlug}/${kbSlug}`;
        localStorage.setItem(GETTING_STARTED_DONE_KEY, 'false');
        this.router.navigate([path]);
      });
  }

  private createKb(
    accountSlug: string,
    accountId: string,
    kbConfig: KnowledgeBoxCreation,
    zone: string,
  ): Observable<{ accountSlug: string; kbSlug: string }> {
    return this.sdk.nuclia.db.createKnowledgeBox(accountId, kbConfig, zone).pipe(
      map(() => ({ accountSlug: accountSlug, kbSlug: kbConfig.slug })),
      catchError((error) => {
        this.tracking.logEvent('account_creation_kb_failed');
        this._kbCreationFailureCount += 1;
        if (this._kbCreationFailureCount < 5) {
          return this.createKb(accountSlug, accountId, kbConfig, zone);
        } else {
          Sentry.captureMessage(`KB creation failed`, { tags: { host: location.hostname } });
          this.toaster.error('stash.create.failure');
          this._onboardingState.next({
            creating: false,
            accountCreated: true,
            kbCreated: false,
            creationFailed: true,
          });
          throw error;
        }
      }),
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
    return isNaN(existingIncrement)
      ? `${slug}_1`
      : `${slug.slice(0, -1 - `${existingIncrement}`.length)}_${existingIncrement + 1}`;
  }
}
