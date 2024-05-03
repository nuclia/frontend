import { inject, Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { SDKService } from '../api';
import { FeatureFlagService } from './feature-flag.service';
import { AccountTypes } from '@nuclia/core';

const UPGRADABLE_ACCOUNT_TYPES: AccountTypes[] = ['stash-trial', 'stash-starter', 'v3starter'];

@Injectable({
  providedIn: 'root',
})
export class FeaturesService {
  private featureFlag = inject(FeatureFlagService);
  private sdk = inject(SDKService);

  private _account = this.sdk.currentAccount;
  private _kb = this.sdk.currentKb;

  /**
   * PERMISSIONS and ACCOUNT TYPES
   */
  isKbAdminOrContrib = this.sdk.isAdminOrContrib;
  isKbAdmin = this._kb.pipe(map((kb) => !!kb.admin || kb.accountId === 'local'));
  isKBContrib = this._kb.pipe(map((kb) => !!kb.admin || !!kb.contrib));
  isAccountManager = this._account.pipe(
    map((account) => {
      return account.can_manage_account;
    }),
  );
  isTrial: Observable<boolean> = this._account.pipe(map((account) => account.type === 'stash-trial'));
  isEnterpriseOrGrowth: Observable<boolean> = this._account.pipe(
    map((account) => ['stash-growth', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type)),
  );
  canUpgrade = combineLatest([this.isAccountManager, this._account]).pipe(
    map(([isAccountManager, account]) => isAccountManager && UPGRADABLE_ACCOUNT_TYPES.includes(account.type)),
  );

  /**
   * UNSTABLE FEATURES are under feature flag, usually hidden in prod (rollout: 0) but can be enabled for some client using account_id_md5 variant
   * when false, the feature is hidden
   * when true, the feature is visible
   */
  unstable: { [key: string]: Observable<boolean> } = {
    billing: this.featureFlag.isFeatureEnabled('billing'),
    training: this.featureFlag.isFeatureEnabled('training'),
    knowledgeGraph: this.featureFlag.isFeatureEnabled('knowledge-graph'),
    githubSignin: this.featureFlag.isFeatureEnabled('github-signin'),
    viewNuaActivity: this.featureFlag.isFeatureEnabled('view-nua-activity'),
    pdfAnnotation: this.featureFlag.isFeatureEnabled('pdf-annotation'),
    openAIModels: this.featureFlag.isFeatureEnabled('openai-models'),
    geckoModel: this.featureFlag.isFeatureEnabled('gecko-model'),
    aiTableProcessing: this.featureFlag.isFeatureEnabled('ai-table-processing'),
    invoiceProcessing: this.featureFlag.isFeatureEnabled('invoice-processing'),
    suggestEntities: this.featureFlag.isFeatureEnabled('suggest-entities'),
    ragImages: this.featureFlag.isFeatureEnabled('rag-images'),

    // FEATURES meant to go to authorized features once stable
    taskAutomation: combineLatest([
      this.featureFlag.isFeatureEnabled('tasks-automation'),
      this.sdk.currentAccount.pipe(
        map((account) => ['stash-growth', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type)),
      ),
    ]).pipe(map(([isFeatureEnabled, isAccountTypeAllowed]) => isFeatureEnabled && isAccountTypeAllowed)),
  };

  /**
   * AUTHORIZED FEATURES are not under feature flag anymore (rollout: 100), but they require certain account type to access the feature.
   * We can enable the feature for some clients using account_id_md5.
   * when false, the feature is disabled with a pro badge
   * when true, the feature is visible
   */
  authorized: { [key: string]: Observable<boolean> } = {
    promptLab: combineLatest([this.isEnterpriseOrGrowth, this.featureFlag.isFeatureAuthorized('llm-prompt-lab')]).pipe(
      map(([isEnterprise, isAuthorized]) => isEnterprise || isAuthorized),
    ),
    synonyms: this.sdk.currentAccount.pipe(
      map((account) =>
        ['stash-growth', 'stash-startup', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type),
      ),
    ),
    activityLog: this.sdk.currentAccount.pipe(
      map((account) => !['stash-trial', 'stash-starter', 'v3starter'].includes(account.type)),
    ),
    summarization: combineLatest([this.featureFlag.isFeatureEnabled('summarization'), this.isEnterpriseOrGrowth]).pipe(
      map(([hasFlag, isAtLeastGrowth]) => hasFlag || isAtLeastGrowth),
    ),
    userPrompts: combineLatest([this.featureFlag.isFeatureEnabled('user-prompts'), this.isEnterpriseOrGrowth]).pipe(
      map(([hasFlag, isAtLeastGrowth]) => hasFlag || isAtLeastGrowth),
    ),
    allowKbManagementFromNuaKey: this.featureFlag.isFeatureAuthorized('allow-kb-management-from-nua-key'),
  };
}
