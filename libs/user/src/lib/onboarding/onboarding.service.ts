import { Injectable } from '@angular/core';
import { GETTING_STARTED_DONE_KEY, OnboardingPayload, OnboardingStatus, OnboardingStep } from './onboarding.models';
import { BehaviorSubject, catchError, map, mapTo, Observable, of, switchMap, tap } from 'rxjs';
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
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private _onboardingStep: BehaviorSubject<OnboardingStep> = new BehaviorSubject<OnboardingStep>('step1');
  private _kbCreationFailureCount = 0;
  private _onboardingState = new BehaviorSubject<OnboardingStatus>({
    creating: false,
    accountCreated: false,
    kbCreated: false,
    creationFailed: false,
    datasetImported: false,
  });

  onboardingState: Observable<OnboardingStatus> = this._onboardingState.asObservable();
  onboardingStep: Observable<OnboardingStep> = this._onboardingStep.asObservable();

  constructor(
    private sdk: SDKService,
    private router: Router,
    private tracking: STFTrackingService,
    private toaster: SisToastService,
    private translate: TranslateService,
    private user: UserService,
  ) {}

  saveOnboardingInquiry(payload: OnboardingPayload) {
    this._onboardingStep.next('step2');
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
    this._onboardingStep.next(configuration.ownData ? 'setting-up-upload' : 'setting-up-dataset');
    this._onboardingState.next({
      creating: true,
      accountCreated: false,
      kbCreated: false,
      creationFailed: false,
      datasetImported: false,
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
                  datasetImported: false,
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
            .getLearningConfigurations()
            .pipe(map((learningConfiguration) => ({ learningConfiguration, accountSlug, accountId })));
        }),
        switchMap(({ learningConfiguration, accountSlug, accountId }) => {
          const kbConfig = {
            slug: 'basic',
            title: 'Basic',
            learning_configuration: {
              semantic_model: getSemanticModel(configuration, learningConfiguration),
            },
          };
          this.tracking.logEvent('kb_creation_submitted', {
            region: configuration.zoneSlug,
            learningConfiguration: kbConfig.learning_configuration?.['semantic_model'] || '',
            firstUpload: (!configuration.ownData ? `Own data` : configuration.dataset) || '',
          });
          this._onboardingState.next({
            creating: true,
            accountCreated: true,
            kbCreated: false,
            creationFailed: false,
            datasetImported: false,
          });
          return this.createKb(accountSlug, accountId, kbConfig, configuration.zoneSlug);
        }),
        switchMap(({ accountSlug, kbSlug, kbId }) => {
          this._onboardingState.next({
            creating: true,
            accountCreated: true,
            kbCreated: true,
            creationFailed: false,
            datasetImported: false,
          });
          if (configuration.dataset) {
            this.tracking.logEvent('importing_dataset_started');
            return this.sdk.nuclia.rest.post(`/export/${configuration.dataset}/import_to/${kbId}`, {}).pipe(
              map(() => {
                this.tracking.logEvent('importing_dataset_done');
                return { accountSlug, kbSlug };
              }),
              catchError(() => {
                this.tracking.logEvent('importing_dataset_failed');
                this.toaster.warning(this.translate.instant('onboarding.setting-up-dataset.import-failed'));
                return of({ accountSlug, kbSlug });
              }),
            );
          } else {
            return of({ accountSlug, kbSlug, kbId });
          }
        }),
      )
      .subscribe(({ accountSlug, kbSlug }) => {
        this._onboardingState.next({
          creating: true,
          accountCreated: true,
          kbCreated: true,
          datasetImported: true,
          creationFailed: false,
        });
        this.tracking.logEvent('account_creation_success');
        const basePath = `/at/${accountSlug}/${configuration.zoneSlug}/${kbSlug}`;
        const path = basePath + (configuration.dataset ? '/search' : '');
        localStorage.setItem(GETTING_STARTED_DONE_KEY, 'false');
        this.router.navigate([path]);
      });
  }

  private createKb(
    accountSlug: string,
    accountId: string,
    kbConfig: KnowledgeBoxCreation,
    zone: string,
  ): Observable<{ accountSlug: string; kbSlug: string; kbId: string }> {
    return this.sdk.nuclia.db.createKnowledgeBox(accountId, kbConfig, zone).pipe(
      map((kb) => ({ accountSlug: accountSlug, kbSlug: kbConfig.slug, kbId: kb.id })),
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
            datasetImported: false,
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
