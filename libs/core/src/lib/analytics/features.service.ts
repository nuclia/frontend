import { Injectable } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { SDKService } from '../api';
import { FeatureFlagService } from './feature-flag.service';

@Injectable({
  providedIn: 'root',
})
export class FeaturesService {
  isEnterpriseOrGrowth = this.sdk.currentAccount.pipe(
    map((account) => ['stash-growth', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type)),
  );

  constructor(
    private featureFlag: FeatureFlagService,
    private sdk: SDKService,
  ) {}

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
  sync = this.featureFlag.isFeatureEnabled('sync');
  promptLabEnabled = this.featureFlag.isFeatureEnabled('llm-prompt-lab');
  citationsForAllEnabled = this.featureFlag.isFeatureEnabled('rerank_citations_enabled');

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
  activityLog = this.sdk.currentAccount.pipe(
    map((account) => !['stash-trial', 'stash-starter', 'v3starter'].includes(account.type)),
  );
}
