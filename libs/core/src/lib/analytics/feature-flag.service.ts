import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { StateService } from '../state.service';
import SparkMD5 from 'spark-md5';

export interface Features {
  [key: string]: boolean;
}

interface FeaturesData {
  [key: string]: {
    rollout: number;
    variants?: {
      account_id_md5?: string[];
    };
  };
}

const CUSTOM_FEATURE_FLAGS = 'NUCLIA_CUSTOM_FEATURE_FLAGS';
const FEATURE_PREFIX = 'application_';

const stageFeatures: Features = {};

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private accountMd5 = this.state.account.pipe(map((account) => (account ? SparkMD5.hash(account.id) : null)));
  private featuresData = fromFetch('https://nuclia.github.io/status/features-v2.json').pipe(
    switchMap((res) => res.json()),
    map((res) => res as FeaturesData),
  );
  private remoteFeatures: Observable<Features> = combineLatest([this.featuresData, this.accountMd5]).pipe(
    map(([data, md5]) =>
      Object.entries(data)
        .filter(([key]) => key.startsWith(FEATURE_PREFIX))
        .reduce((acc, [key, feature]) => {
          return {
            ...acc,
            [key.slice(FEATURE_PREFIX.length)]:
              feature?.rollout === 1 || // TODO: this line keeps backward compatibility. Can be delete once feature flag data uses 100 instead of 1
              feature?.rollout === 100 ||
              (feature?.variants?.account_id_md5 || []).includes(md5 || ''),
          };
        }, {}),
    ),
    shareReplay(1),
  );
  private stageFeatures = new BehaviorSubject<Features>({ ...stageFeatures, ...this.getCustomFeatures() });
  private features: Observable<Features> = this.remoteFeatures.pipe(
    map((features) => ({ ...features, ...this.getCustomFeatures() })),
  );

  private isNotProd = location.hostname !== 'nuclia.cloud';

  constructor(private state: StateService) {}

  isFeatureEnabled(feature: string): Observable<boolean> {
    if (this.isNotProd) {
      return this.stageFeatures.pipe(map((features) => features[feature] || true));
    } else {
      return this.features.pipe(map((features) => features[feature]));
    }
  }

  getEnabledFeatures(): Observable<string[]> {
    return this.features.pipe(
      map((features) =>
        Object.entries(features)
          .filter(([, value]) => this.isNotProd || !!value)
          .map(([key]) => key),
      ),
    );
  }

  getFeatures(): Observable<Features> {
    return this.isNotProd ? this.stageFeatures : this.features;
  }

  getDefaultFeatures(): Observable<Features> {
    return this.isNotProd ? of(stageFeatures) : this.remoteFeatures;
  }

  getCustomFeatures(): Features {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_FEATURE_FLAGS) || '{}') as Features;
    } catch {
      return {};
    }
  }

  setCustomFeatures(features: Features) {
    localStorage.setItem(CUSTOM_FEATURE_FLAGS, JSON.stringify(features));
  }
}
