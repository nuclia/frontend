import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, FeaturesService, NavigationService, SDKService, STFUtils, UserService } from '@flaps/core';
import {
  Account,
  AccountModification,
  AskAgentCreation,
  DriverCreation,
  KnowledgeBoxCreation,
  NucliaDBConfig,
  RetrievalAgentCreation,
  SignUpInfo,
  WorkflowType,
  WritableKnowledgeBox,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import * as Sentry from '@sentry/angular';
import { addDays } from 'date-fns/addDays';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { OnboardingPayload, OnboardingStatus } from './onboarding.models';

const STEPS = [1, 2, 3, 4, 5];
const CLASSIC_STEPS = [1, 3, 4, 5];
const COWORK_STEPS = [1, 3, 4, 5];
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

  readonly knowledgeBoxKbName = 'Default';
  readonly contextBoxKbName = 'ContextBox';
  readonly contextBoxDefaultModel = 'gemma-4-26b-a4b';

  onboardingState: Observable<OnboardingStatus> = this._onboardingState.asObservable();
  onboardingStep: Observable<number> = this._onboardingStep.asObservable();

  dashboardSteps = this.features.unstable.coworkAccount.pipe(
    map((canChooseWorkflow) => (canChooseWorkflow ? STEPS : CLASSIC_STEPS)),
  );
  raoSteps = of([1, 4, 5]);

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
      const next = Math.min(...steps.filter((s) => s > step));
      this._onboardingStep.next(next);
    });
  }
  previousStep() {
    (this.navigation.inRaoApp ? this.raoSteps : this.dashboardSteps).pipe(take(1)).subscribe((steps) => {
      const step = this._onboardingStep.value;
      if (step > 1) {
        const previous = Math.max(...steps.filter((s) => s < step));
        this._onboardingStep.next(previous);
      }
    });
  }

  setSteps(workflow: WorkflowType) {
    this.dashboardSteps = workflow === 'cowork' ? of(COWORK_STEPS) : of(CLASSIC_STEPS);
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

  getSignUpData(): Observable<SignUpInfo | null> {
    const signupToken = this.authService.getSignUpToken();
    if (signupToken) {
      return this.sdk.nuclia.db.getSignupInfo(signupToken || '').pipe(
        catchError((error) => {
          return of(null);
        }),
      );
    } else {
      return of(null);
    }
  }

  createAccount(data: SignUpInfo): Observable<Account> {
    this._onboardingState.next({
      creating: true,
      accountCreated: false,
      kbCreated: false,
      creationFailed: false,
    });
    if (data.workflow) {
      this.setSteps(data.workflow);
    }
    return this.sdk.nuclia.db
      .createAccount({
        title: data.company,
        workflow: data.workflow,
        eula_accepted: true,
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

  modifyAccount(accountSlug: string, data: AccountModification): Observable<void> {
    return this.sdk.nuclia.db.modifyAccount(accountSlug, data);
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
    return this._createKb(accountSlug, accountId, kbConfig, zone).pipe(
      tap(({ accountSlug, kbSlug }) => this.manageKbCreationSuccess(accountSlug, zone, kbSlug)),
    );
  }

  createContextBox(
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
    return this._createKb(accountSlug, accountId, kbConfig, zone).pipe(
      switchMap((kbAndSlugs) => {
        // Creation of a new WritableKnowledgeBox to make sure zone is properly provided in all the following calls
        this.sdk.nuclia.options.zone = kbAndSlugs.kb.zone;
        const kb = new WritableKnowledgeBox(this.sdk.nuclia, accountId, kbAndSlugs.kb);

        const agentName = `${kbConfig.title}Agent`;
        const retrievalAgentConfig: RetrievalAgentCreation = {
          title: agentName,
          slug: STFUtils.generateSlug(agentName),
          mode: 'agent_no_memory',
        };
        return this.sdk.nuclia.db.createRetrievalAgent(accountId, retrievalAgentConfig, zone).pipe(
          switchMap((arag) => {
            const driverIdentifier = `nucliadb-${STFUtils.generateRandomSlugSuffix()}`;
            // Create API key for this agent
            const serviceTitle = `${agentName} key`;
            return kb.createServiceAccount({ title: serviceTitle, role: 'SMEMBER' }).pipe(
              switchMap(() => kb.getServiceAccounts()),
              switchMap((list) => {
                const sa = list.find((service) => service.title === serviceTitle);
                // using the max expiration date as defined in ExpirationModalComponent
                const expires = Math.floor(new Date(addDays(new Date(), 1095)).getTime() / 1000).toString();
                return kb.createKey(sa?.id || '', expires).pipe(map((data) => data.token));
              }),
              // Create a NucliaDB driver pointing to the KB
              switchMap((key) => {
                const url = kb.fullpath.slice(0, kb.fullpath.indexOf('/api') + 4);
                const nucliaDbConfig: NucliaDBConfig = {
                  key,
                  url,
                  manager: url,
                  description: 'Main repository for all the documents',
                  kbid: kb.id,
                  filters: [],
                };
                const driver: DriverCreation = {
                  name: agentName,
                  provider: 'nucliadb',
                  config: nucliaDbConfig,
                  identifier: driverIdentifier,
                };
                return arag.addDriver(driver);
              }),
              // Setup workflow with a retrieval step and a summarize steps
              switchMap(() => {
                // Retrieval step: basic ask using the KB as source
                const contextAgent: AskAgentCreation = {
                  module: 'ask',
                  sources: [driverIdentifier],
                  extra_fields: [],
                  full_resource: false,
                  vllm: true,
                };
                return arag.addContext(contextAgent);
              }),
              switchMap(() => {
                // Generation step: basic summarize
                return arag.addGeneration({ module: 'summarize' });
              }),
            );
          }),
          map(() => ({ accountSlug: kbAndSlugs.accountSlug, kbSlug: kbAndSlugs.kbSlug })),
        );
      }),
      tap(({ accountSlug, kbSlug }) => this.manageKbCreationSuccess(accountSlug, zone, kbSlug)),
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
    this.router.navigate([path]);
  }

  private _createKb(
    accountSlug: string,
    accountId: string,
    kbConfig: KnowledgeBoxCreation,
    zone: string,
    failCount = 0,
  ): Observable<{ accountSlug: string; kbSlug: string; kb: WritableKnowledgeBox }> {
    return this.sdk.nuclia.db.createKnowledgeBox(accountId, kbConfig, zone).pipe(
      map((kb) => ({ accountSlug, kbSlug: kbConfig.slug, kb })),
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
            return this._createKb(accountSlug, accountId, kbConfig, zone, failCount);
          } else {
            this.manageCreationError(accountSlug, `KB creation failed`);
            throw error;
          }
        }
      }),
    );
  }

  private manageKbCreationSuccess(accountSlug: string, zone: string, kbSlug: string): void {
    this._onboardingState.next({
      creating: true,
      accountCreated: true,
      kbCreated: true,
      creationFailed: false,
    });
    window.location.href = `${this.sdk.getOriginForApp('rag')}/at/${accountSlug}/${zone}/${kbSlug}`;
  }
}
