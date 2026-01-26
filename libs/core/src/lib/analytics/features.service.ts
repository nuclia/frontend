import { inject, Injectable } from '@angular/core';
import { AccountTypes } from '@nuclia/core';
import { combineLatest, map, Observable, of } from 'rxjs';
import { SDKService } from '../api';
import { FeatureFlagService } from './feature-flag.service';

const UPGRADABLE_ACCOUNT_TYPES: AccountTypes[] = ['stash-trial'];

@Injectable({
  providedIn: 'root',
})
export class FeaturesService {
  private featureFlag = inject(FeatureFlagService);
  private sdk = inject(SDKService);

  private _account = this.sdk.currentAccount;
  private _kb = this.sdk.currentKb;
  private _arag = this.sdk.currentArag;

  /**
   * PERMISSIONS and ACCOUNT TYPES
   */
  isKbAdminOrContrib = this.sdk.isAdminOrContrib;
  isKbAdmin = this._kb.pipe(map((kb) => !!kb.admin || kb.accountId === 'local'));
  isKBContrib = this._kb.pipe(map((kb) => !!kb.admin || !!kb.contrib));
  isAragAdmin = this._arag.pipe(map((arag) => !!arag.admin || arag.accountId === 'local'));
  isAragContrib = this._arag.pipe(map((arag) => !!arag.admin || !!arag.contrib));
  isAccountManager = this._account.pipe(
    map((account) => {
      return account.can_manage_account;
    }),
  );
  isTrial: Observable<boolean> = this._account.pipe(map((account) => !!account.trial_expiration_date));

  // Note: v3growth and v3fly are here for backward compatibility with old accounts
  isEnterpriseOrPro: Observable<boolean> = this._account.pipe(
    map((account) => ['v3growth', 'v3pro', 'v3enterprise'].includes(account.type)),
  );
  isEnterpriseOrProOrStarter: Observable<boolean> = this._account.pipe(
    map((account) => ['v3fly', 'v3starter', 'v3growth', 'v3pro', 'v3enterprise'].includes(account.type)),
  );
  canUpgrade = combineLatest([this.isAccountManager, this._account]).pipe(
    map(([isAccountManager, account]) => isAccountManager && UPGRADABLE_ACCOUNT_TYPES.includes(account.type)),
  );

  /**
   * UNSTABLE FEATURES are under feature flag, usually hidden in prod (rollout: 0) but can be enabled for some client using account_id_md5 variant
   * when false, the feature is hidden
   * when true, the feature is visible
   */
  unstable = {
    billing: this.featureFlag.isFeatureEnabled('billing'),
    training: this.featureFlag.isFeatureEnabled('training'),
    knowledgeGraph: this.featureFlag.isFeatureEnabled('knowledge-graph'),
    githubSignin: this.featureFlag.isFeatureEnabled('github-signin'),
    viewNuaActivity: this.featureFlag.isFeatureEnabled('view-nua-activity'),
    extraSemanticModel: this.featureFlag.isFeatureEnabled('extra-semantic-model'),
    synonyms: this.featureFlag.isFeatureEnabled('synonyms-enabled'),
    speech: this.featureFlag.isFeatureEnabled('speech'),
    promptSafetyTask: this.featureFlag.isFeatureEnabled('prompt-safety-task'),
    contentSafetyTask: this.featureFlag.isFeatureEnabled('content-safety-task'),
    retrievalAgents: this.featureFlag.isFeatureEnabled('retrieval-agents'),
    modelManagement: this.featureFlag.isFeatureEnabled('model-management'),
    routing: this.featureFlag.isFeatureEnabled('routing'),
    aragWithMemory: this.featureFlag.isFeatureEnabled('arag-with-memory'),
    sitefinityConnector: this.featureFlag.isFeatureEnabled('sitefinity-connector'),
    bedrockIntegration: this.featureFlag.isFeatureEnabled('bedrock-integration'),
    cloudSyncService: this.featureFlag.isFeatureEnabled('cloud-sync-service'),
    raoWidget: this.featureFlag.isFeatureEnabled('rao-widget'),
  };

  /**
   * AUTHORIZED FEATURES are not under feature flag anymore (rollout: 100), but they require certain account type to access the feature.
   * We can enable the feature for some clients using account_id_md5.
   * when false, the feature is disabled with a pro badge
   * when true, the feature is visible
   */
  authorized = {
    promptLab: combineLatest([
      this.isEnterpriseOrPro,
      this.isTrial,
      this.featureFlag.isFeatureAuthorized('llm-prompt-lab'),
    ]).pipe(map(([isEnterprise, isTrial, isAuthorized]) => isEnterprise || isTrial || isAuthorized)),
    summarization: combineLatest([this.isEnterpriseOrPro, this.featureFlag.isFeatureAuthorized('summarization')]).pipe(
      map(([isAtLeastGrowth, isAuthorized]) => isAtLeastGrowth || isAuthorized),
    ),
    allowKbManagementFromNuaKey: combineLatest([
      this.isEnterpriseOrPro,
      this.featureFlag.isFeatureAuthorized('allow-kb-management-from-nua-key'),
    ]).pipe(map(([isAtLeastGrowth, isAuthorized]) => isAtLeastGrowth || isAuthorized)),
    hideWidgetLogo: this.isEnterpriseOrPro,
    vectorset: combineLatest([
      this.isEnterpriseOrPro,
      this.isTrial,
      this.featureFlag.isFeatureAuthorized('vectorset'),
    ]).pipe(map(([isEnterprise, isTrial, isAuthorized]) => isEnterprise || isTrial || isAuthorized)),
    graphTask: combineLatest([
      this.featureFlag.isFeatureAuthorized('graph-task'),
      this.isEnterpriseOrProOrStarter,
    ]).pipe(map(([isAuthorized, isAccountTypeAllowed]) => isAuthorized || isAccountTypeAllowed)),
    questionsTask: combineLatest([
      this.featureFlag.isFeatureAuthorized('questions-task'),
      this.isEnterpriseOrProOrStarter,
    ]).pipe(map(([isAuthorized, isAccountTypeAllowed]) => isAuthorized || isAccountTypeAllowed)),
    graphSearch: combineLatest([this.featureFlag.isFeatureAuthorized('graph-search'), this.isEnterpriseOrPro]).pipe(
      map(([isAuthorized, isAccountTypeAllowed]) => isAuthorized || isAccountTypeAllowed),
    ),
    showDemoButton: this.featureFlag.isFeatureEnabled('demo-button'),
    ragImages: this.featureFlag.isFeatureEnabled('rag-images'),
    suggestEntities: this.featureFlag.isFeatureEnabled('suggest-entities'),
    aiTableProcessing: this.featureFlag.isFeatureEnabled('ai-table-processing'),
    visualLLMProcessing: this.featureFlag.isFeatureEnabled('visual-llm-processing'),
    extractConfig: this.featureFlag.isFeatureEnabled('extract-config'),
    splitConfig: this.featureFlag.isFeatureEnabled('split-config'),
    remiMetrics: this.featureFlag.isFeatureEnabled('remi-metrics'),
    huggingFaceSemanticModel: this.featureFlag.isFeatureEnabled('hugging-face-semantic'),
  };
}
