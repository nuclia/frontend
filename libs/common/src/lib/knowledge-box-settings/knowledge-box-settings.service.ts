import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import {
  LearningConfiguration,
  LearningConfigurationSet,
  LearningConfigurationUserKeys,
  USER_PROMPTS,
} from '@nuclia/core';
import { take } from 'rxjs/operators';
import { FeatureFlagService, SDKService } from '@flaps/core';

@Injectable({
  providedIn: 'root',
})
export class KnowledgeBoxSettingsService {
  constructor(
    private sdk: SDKService,
    private featureFlagService: FeatureFlagService,
  ) {}

  getVisibleLearningConfiguration(onCreation = true): Observable<{
    display: LearningConfigurationSet;
    full: LearningConfigurationSet;
    keys: LearningConfigurationUserKeys;
  }> {
    return forkJoin([
      this.featureFlagService.isFeatureEnabled('kb-anonymization').pipe(take(1)),
      this.featureFlagService.isFeatureEnabled('pdf-annotation').pipe(take(1)),
      this.sdk.nuclia.db.getLearningConfigurations().pipe(take(1)),
      this.sdk.currentAccount.pipe(take(1)),
    ]).pipe(
      map(([hasAnonymization, hasPdfAnnotation, conf, account]) => {
        const full = Object.entries(conf)
          .filter(([id, value]) => 'options' in value || (!onCreation && id === USER_PROMPTS))
          .map((entry) => entry as [string, LearningConfiguration])
          .map(([id, data]) => ({ id, data }))
          // some options cannot be changed after kb creation
          .filter((entry) => (onCreation && entry.data.create) || (!onCreation && entry.data.update));

        return {
          // At display, hide configurations with only one option or under feature flagging
          display: full.filter(
            (entry) =>
              entry.id === USER_PROMPTS ||
              (entry.data.options &&
                entry.data.options.length > 1 &&
                (entry.id !== 'anonymization_model' || hasAnonymization) &&
                (entry.id !== 'visual_labeling' || hasPdfAnnotation)),
          ),
          full,
          keys:
            account.type === 'stash-enterprise'
              ? Object.entries(conf['user_keys']?.schemas || {}).reduce((acc, [schemaId, schema]) => {
                  acc[schemaId] = Object.entries(schema.properties)
                    .filter(([, property]) => property.type === 'string')
                    .reduce(
                      (acc, [propertyId, property]) => {
                        acc[propertyId] = {
                          title: property.title,
                          required: schema.required.includes(propertyId),
                          textarea: property.widget === 'textarea',
                        };
                        return acc;
                      },
                      {} as { [key: string]: { title: string; required: boolean; textarea: boolean } },
                    );
                  return acc;
                }, {} as LearningConfigurationUserKeys)
              : {},
        };
      }),
    );
  }
}
