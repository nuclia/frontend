import { inject, Inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import SparkMD5 from 'spark-md5';
import { BackendConfigurationService, StaticEnvironmentConfiguration } from '../config';
import { SDKService } from '../api/sdk.service';

export interface Features {
  [key: string]: boolean | undefined;
}

interface FeaturesData {
  [key: string]: {
    rollout: number;
    variants?: {
      account_id_md5?: string[];
      blocklist?: string[];
    };
  };
}

const CUSTOM_FEATURE_FLAGS = 'NUCLIA_CUSTOM_FEATURE_FLAGS';
const ENABLE_BLOCKED_ZONES = 'NUCLIA_ENABLE_BLOCKED_ZONES';
const FEATURE_PREFIX = 'application_';
const BACKEND_PREFIXES = ['nucliadb_', 'nua_'];

const stageFeatures: Features = {};

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private backendConfig = inject(BackendConfigurationService);
  private accountMd5 = this.sdk.hasAccount.pipe(
    switchMap((hasAccount) =>
      hasAccount
        ? this.sdk.currentAccount.pipe(
            map((account) => SparkMD5.hash(account.id)),
            shareReplay(1),
          )
        : of(''),
    ),
  );
  // features-v2.json stored in the GitHub /status repo is automatically pushed to the Nuclia CDN
  // to avoid strict security policy issues in the customer side
  private featuresData = fromFetch(`${this.backendConfig.getCDN()}/features/features-v2.json`).pipe(
    switchMap((res) => res.json()),
    map((res) => res as FeaturesData),
    shareReplay(1),
  );

  /**
   * UNSTABLE FEATURES are under feature flag: "rollout: 0", meaning hidden in prod but can be enabled for some client using account_id_md5 variant
   */
  private applicationRemoteFeatures: Observable<Features> = combineLatest([this.featuresData, this.accountMd5]).pipe(
    map(([data, md5]) =>
      Object.entries(data)
        .filter(([key]) => key.startsWith(FEATURE_PREFIX))
        .reduce((acc, [key, feature]) => {
          return {
            ...acc,
            [key.slice(FEATURE_PREFIX.length)]:
              feature?.rollout === 100 || (feature?.variants?.account_id_md5 || []).includes(md5),
          };
        }, {}),
    ),
  );
  /**
   * STABLE FEATURES are not under feature flag: "rollout: 100" but are restricted depending on account type.
   * Can also be enabled for some client using account_id_md5 variant
   */
  private applicationAuthorizedFeatures: Observable<Features> = combineLatest([
    this.featuresData,
    this.accountMd5,
  ]).pipe(
    map(([data, md5]) =>
      Object.entries(data)
        .filter(([key]) => key.startsWith(FEATURE_PREFIX))
        .reduce((acc, [key, feature]) => {
          return {
            ...acc,
            [key.slice(FEATURE_PREFIX.length)]: (feature?.variants?.account_id_md5 || []).includes(md5),
          };
        }, {}),
    ),
  );
  private backendFeatures: Observable<Features> = combineLatest([this.featuresData, this.accountMd5]).pipe(
    map(([data, md5]) =>
      Object.entries(data)
        .filter(([key]) => !key.startsWith(FEATURE_PREFIX))
        .reduce((acc, [key, feature]) => {
          return {
            ...acc,
            [key]: feature?.rollout === 100 || (feature?.variants?.account_id_md5 || []).includes(md5),
          };
        }, {}),
    ),
  );
  private stageFeatures = new BehaviorSubject<Features>({ ...stageFeatures, ...this.getCustomFeatures() });
  private applicationFeatures: Observable<Features> = this.applicationRemoteFeatures.pipe(
    map((features) => ({ ...features, ...this.getCustomFeatures() })),
  );

  isStageOrDev =
    location.hostname === 'stashify.cloud' ||
    location.hostname === 'gcp-global-dev-1.nuclia.io' ||
    !this.environment.production;

  constructor(
    private sdk: SDKService,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
  ) {}

  isFeatureEnabled(feature: string): Observable<boolean> {
    if (this.isStageOrDev) {
      return this.stageFeatures.pipe(map((features) => !!features[feature] || true));
    } else {
      const isBackendPrefix = BACKEND_PREFIXES.some((prefix) => feature.startsWith(prefix));
      return isBackendPrefix
        ? this.backendFeatures.pipe(map((features) => !!features[feature]))
        : this.applicationFeatures.pipe(map((features) => !!features[feature]));
    }
  }

  isFeatureAuthorized(feature: string): Observable<boolean> {
    return this.applicationAuthorizedFeatures.pipe(map((features) => !!features[feature]));
  }

  getDisabledFeatures(): Observable<Features> {
    const customFeatures = this.getCustomFeatures();
    return this.featuresData.pipe(
      map((features) =>
        Object.entries(features)
          .filter(([key]) => key.startsWith(FEATURE_PREFIX))
          .filter(([, value]) => !value.rollout)
          .reduce((map, [key, value]) => {
            const appKey = key.slice(FEATURE_PREFIX.length);
            map[appKey] = customFeatures[appKey];
            return map;
          }, {} as Features),
      ),
    );
  }

  getEnabledFeatures(): Observable<string[]> {
    return this.applicationFeatures.pipe(
      map((features) =>
        Object.entries(features)
          .filter(([, value]) => this.isStageOrDev || !!value)
          .map(([key]) => key),
      ),
    );
  }

  getFeatures(): Observable<Features> {
    return this.isStageOrDev ? this.stageFeatures : this.applicationFeatures;
  }

  getDefaultFeatures(): Observable<Features> {
    return this.isStageOrDev ? of(stageFeatures) : this.applicationRemoteFeatures;
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

  getFeatureBlocklist(feature: string): Observable<string[]> {
    return this.featuresData.pipe(
      map((features) => {
        const featureData = features[FEATURE_PREFIX + feature];
        return featureData?.variants?.blocklist || [];
      }),
    );
  }

  showBlockedZones(): boolean {
    return JSON.parse(localStorage.getItem(ENABLE_BLOCKED_ZONES) || 'false');
  }

  changeBlockedZones(show: boolean) {
    localStorage.setItem(ENABLE_BLOCKED_ZONES, JSON.stringify(show));
  }
}
