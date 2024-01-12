import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import {
  LearningConfiguration,
  LearningConfigurationSet,
  LearningConfigurationUserKeys,
  SUMMARY_PROMPT,
  USER_PROMPTS,
} from '@nuclia/core';
import { take } from 'rxjs/operators';
import { FeaturesService, SDKService } from '@flaps/core';

@Injectable({
  providedIn: 'root',
})
export class KnowledgeBoxSettingsService {
  constructor(
    private sdk: SDKService,
    private features: FeaturesService,
  ) {}

  getVisibleLearningConfiguration(onCreation = true): Observable<{
    display: LearningConfigurationSet;
    full: LearningConfigurationSet;
    keys: LearningConfigurationUserKeys;
  }> {
    return forkJoin([
      this.features.kbAnonymization.pipe(take(1)),
      this.features.pdfAnnotation.pipe(take(1)),
      this.features.summarization.pipe(take(1)),
      this.sdk.nuclia.db.getLearningConfigurations().pipe(take(1)),
      this.sdk.currentAccount.pipe(take(1)),
    ]).pipe(
      map(([hasAnonymization, hasPdfAnnotation, hasSummarization, conf, account]) => {
        const full = Object.entries(conf)
          .filter(
            ([id, value]) => 'options' in value || (!onCreation && (id === USER_PROMPTS || id === SUMMARY_PROMPT)),
          )
          .map((entry) => entry as [string, LearningConfiguration])
          .map(([id, data]) => ({ id, data }))
          // some options cannot be changed after kb creation
          .filter((entry) => (onCreation && entry.data.create) || (!onCreation && entry.data.update));

        return {
          // At display, hide configurations with only one option or under feature flagging
          display: full.filter(
            (entry) =>
              entry.id === USER_PROMPTS ||
              (hasSummarization && entry.id === SUMMARY_PROMPT) ||
              (entry.data.options &&
                entry.id !== 'semantic_model' &&
                entry.data.options.length > 1 &&
                (entry.id !== 'anonymization_model' || hasAnonymization) &&
                (entry.id !== 'visual_labeling' || hasPdfAnnotation) &&
                (entry.id !== 'summary' || hasSummarization) &&
                (entry.id !== 'summary_model' || hasSummarization)),
          ),
          full,
          keys:
            account.type === 'stash-enterprise' || account.type === 'v3enterprise'
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
