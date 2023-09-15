import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

export interface Features {
  [key: string]: string | boolean | undefined;
}

const CUSTOM_FEATURE_FLAGS = 'NUCLIA_CUSTOM_FEATURE_FLAGS';

const stageFeatures: Features = {};

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private remoteFeatures = fromFetch('https://nuclia.github.io/status/features.json').pipe(
    switchMap((res) => res.json()),
    shareReplay(),
  );
  private stageFeatures = new BehaviorSubject<Features>({ ...stageFeatures, ...this.getCustomFeatures() });
  private features: Observable<Features> = this.remoteFeatures.pipe(
    map((features) => ({ ...features, ...this.getCustomFeatures() })),
  );

  private isNotProd = location.hostname !== 'nuclia.cloud';

  isFeatureEnabled(feature: string): Observable<boolean> {
    if (this.isNotProd) {
      return this.stageFeatures.pipe(map((features) => (features[feature] !== undefined ? !!features[feature] : true)));
    } else {
      return this.features.pipe(map((features) => !!features[feature]));
    }
  }

  getFeatureFlag(feature: string): Observable<string | boolean | undefined> {
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
