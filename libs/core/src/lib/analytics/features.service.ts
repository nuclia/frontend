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
   * FEATURES
   */
  billing = this.featureFlag.isFeatureEnabled('billing');
  training = this.featureFlag.isFeatureEnabled('training');
  trainingNer = this.featureFlag.isFeatureEnabled('training_ner');
  knowledgeGraph = this.featureFlag.isFeatureEnabled('knowledge-graph');
  githubSignin = this.featureFlag.isFeatureEnabled('github-signin');
  manageEntities = this.featureFlag.isFeatureEnabled('manage-entities');
  kbAnonymization = this.featureFlag.isFeatureEnabled('kb-anonymization');
  viewNuaActivity = this.featureFlag.isFeatureEnabled('view-nua-activity');
  downloadDesktopApp = this.featureFlag.isFeatureEnabled('download-desktop-app');
  uploadQAndA = this.featureFlag.isFeatureEnabled('upload-q-and-a');
  suggestEntities = this.featureFlag.isFeatureEnabled('suggest-entities');
  allowKbManagementFromNuaKey = this.featureFlag.isFeatureEnabled('allow-kb-management-from-nua-key');
  newPricing = this.featureFlag.isFeatureEnabled('new-pricing');
  pdfAnnotation = this.featureFlag.isFeatureEnabled('pdf-annotation');
  promptLabEnabled = this.featureFlag.isFeatureEnabled('llm-prompt-lab');
  ragHierarchy = this.featureFlag.isFeatureEnabled('rag-hierarchy');
  ragImages = this.featureFlag.isFeatureEnabled('rag-images');
  englishModel = this.featureFlag.isFeatureEnabled('english-model');
  openAIModels = this.featureFlag.isFeatureEnabled('openai-models');
  geckoModel = this.featureFlag.isFeatureEnabled('gecko-model');
  aiTableProcessing = this.featureFlag.isFeatureEnabled('ai-table-processing');
  invoiceProcessing = this.featureFlag.isFeatureEnabled('invoice-processing');

  // user-prompts and summarization are always enabled for growth and enterprise accounts
  // but are still managed as a feature flagged feature for other account types, so we can enable it specifically for some accounts
  // through the `variants` field in `status/features-v2.json`
  userPrompts = combineLatest([this.featureFlag.isFeatureEnabled('user-prompts'), this.isEnterpriseOrGrowth]).pipe(
    map(([hasFlag, isAtLeastGrowth]) => hasFlag || isAtLeastGrowth),
  );
  summarization = combineLatest([this.featureFlag.isFeatureEnabled('summarization'), this.isEnterpriseOrGrowth]).pipe(
    map(([hasFlag, isAtLeastGrowth]) => hasFlag || isAtLeastGrowth),
  );

  synonyms = this.sdk.currentAccount.pipe(
    map((account) =>
      ['stash-growth', 'stash-startup', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type),
    ),
  );
  taskAutomation = combineLatest([
    this.featureFlag.isFeatureEnabled('tasks-automation'),
    this.sdk.currentAccount.pipe(
      map((account) => ['stash-growth', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type)),
    ),
  ]).pipe(map(([isFeatureEnabled, isAccountTypeAllowed]) => isFeatureEnabled && isAccountTypeAllowed));
  activityLog = this.sdk.currentAccount.pipe(
    map((account) => !['stash-trial', 'stash-starter', 'v3starter'].includes(account.type)),
  );
}
