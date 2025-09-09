import { inject, Injectable } from '@angular/core';
import { AccountTypes } from '@nuclia/core';
import { combineLatest, map, Observable } from 'rxjs';
import { SDKService } from '../api';
import { FeatureFlagService } from './feature-flag.service';

const UPGRADABLE_ACCOUNT_TYPES: AccountTypes[] = ['stash-trial', 'stash-starter', 'v3starter'];

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
  unstable = {
    billing: this.featureFlag.isFeatureEnabled('billing'),
    training: this.featureFlag.isFeatureEnabled('training'),
    knowledgeGraph: this.featureFlag.isFeatureEnabled('knowledge-graph'),
    githubSignin: this.featureFlag.isFeatureEnabled('github-signin'),
    viewNuaActivity: this.featureFlag.isFeatureEnabled('view-nua-activity'),
    extraSemanticModel: this.featureFlag.isFeatureEnabled('extra-semantic-model'),
    huggingFaceSemanticModel: this.featureFlag.isFeatureEnabled('hugging-face-semantic'),
    blanklineSplitter: this.featureFlag.isFeatureEnabled('blankline-splitter'),
    tableProcessing: this.featureFlag.isFeatureEnabled('table-processing'),
    aiTableProcessing: this.featureFlag.isFeatureEnabled('ai-table-processing'),
    invoiceProcessing: this.featureFlag.isFeatureEnabled('invoice-processing'),
    visualLLMProcessing: this.featureFlag.isFeatureEnabled('visual-llm-processing'),
    suggestEntities: this.featureFlag.isFeatureEnabled('suggest-entities'),
    ragImages: this.featureFlag.isFeatureEnabled('rag-images'),
    synonyms: this.featureFlag.isFeatureEnabled('synonyms-enabled'),
    externalIndex: this.featureFlag.isFeatureEnabled('external-index-provider'),
    remiMetrics: this.featureFlag.isFeatureEnabled('remi-metrics'),
    speech: this.featureFlag.isFeatureEnabled('speech'),
    graphTask: this.featureFlag.isFeatureEnabled('graph-task'),
    questionsTask: this.featureFlag.isFeatureEnabled('questions-task'),
    promptSafetyTask: this.featureFlag.isFeatureEnabled('prompt-safety-task'),
    contentSafetyTask: this.featureFlag.isFeatureEnabled('content-safety-task'),
    graphSearch: this.featureFlag.isFeatureEnabled('graph-search'),
    extractConfig: this.featureFlag.isFeatureEnabled('extract-config'),
    splitConfig: this.featureFlag.isFeatureEnabled('split-config'),
    retrievalAgents: this.featureFlag.isFeatureEnabled('retrieval-agents'),
    modelManagement: this.featureFlag.isFeatureEnabled('model-management'),
    aragAlinia: this.featureFlag.isFeatureEnabled('arag-alinia'),
    aragCondition: this.featureFlag.isFeatureEnabled('arag-condition'),
    aragGuardRails: this.featureFlag.isFeatureEnabled('arag-guardrails'),
    aragSql: this.featureFlag.isFeatureEnabled('arag-sql'),
    aragCypher: this.featureFlag.isFeatureEnabled('arag-cypher'),
    aragRestrictedPython: this.featureFlag.isFeatureEnabled('arag-restricted-python'),
    aragMcp: this.featureFlag.isFeatureEnabled('arag-mcp'),
  };

  /**
   * AUTHORIZED FEATURES are not under feature flag anymore (rollout: 100), but they require certain account type to access the feature.
   * We can enable the feature for some clients using account_id_md5.
   * when false, the feature is disabled with a pro badge
   * when true, the feature is visible
   */
  authorized = {
    promptLab: combineLatest([this.isEnterpriseOrGrowth, this.featureFlag.isFeatureAuthorized('llm-prompt-lab')]).pipe(
      map(([isEnterprise, isAuthorized]) => isEnterprise || isAuthorized),
    ),
    activityLog: this._account.pipe(
      map((account) => !['stash-trial', 'stash-starter', 'v3starter'].includes(account.type)),
    ),
    summarization: combineLatest([
      this.isEnterpriseOrGrowth,
      this.featureFlag.isFeatureAuthorized('summarization'),
    ]).pipe(map(([isAtLeastGrowth, isAuthorized]) => isAtLeastGrowth || isAuthorized)),
    userPrompts: combineLatest([this.isEnterpriseOrGrowth, this.featureFlag.isFeatureAuthorized('user-prompts')]).pipe(
      map(([isAtLeastGrowth, isAuthorized]) => isAtLeastGrowth || isAuthorized),
    ),
    allowKbManagementFromNuaKey: combineLatest([
      this.isEnterpriseOrGrowth,
      this.featureFlag.isFeatureAuthorized('allow-kb-management-from-nua-key'),
    ]).pipe(map(([isAtLeastGrowth, isAuthorized]) => isAtLeastGrowth || isAuthorized)),
    anonymization: combineLatest([this.isTrial, this.featureFlag.isFeatureAuthorized('anonymization')]).pipe(
      map(([isTrial, isAuthorized]) => !isTrial || isAuthorized),
    ),
    hideWidgetLogo: this._account.pipe(
      map((account) =>
        ['stash-growth', 'stash-startup', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type),
      ),
    ),
    vectorset: combineLatest([this.isEnterpriseOrGrowth, this.featureFlag.isFeatureAuthorized('vectorset')]).pipe(
      map(([isEnterprise, isAuthorized]) => isEnterprise || isAuthorized),
    ),
    taskAutomation: combineLatest([
      this.featureFlag.isFeatureAuthorized('tasks-automation'),
      this._account.pipe(
        map((account) => ['stash-growth', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type)),
      ),
    ]).pipe(map(([isAuthorized, isAccountTypeAllowed]) => isAuthorized || isAccountTypeAllowed)),
    labelerTask: combineLatest([
      this.featureFlag.isFeatureAuthorized('labeller-task'),
      this._account.pipe(
        map((account) => ['stash-growth', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type)),
      ),
    ]).pipe(map(([isAuthorized, isAccountTypeAllowed]) => isAuthorized || isAccountTypeAllowed)),
    askTask: combineLatest([
      this.featureFlag.isFeatureAuthorized('ask-task'),
      this._account.pipe(
        map((account) => ['stash-growth', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type)),
      ),
    ]).pipe(map(([isAuthorized, isAccountTypeAllowed]) => isAuthorized || isAccountTypeAllowed)),
    showDemoButton: this.featureFlag.isFeatureEnabled('demo-button'),
  };
}
