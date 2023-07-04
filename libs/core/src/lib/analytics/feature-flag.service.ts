import { Injectable } from '@angular/core';
import { BehaviorSubject, from, map, Observable, shareReplay } from 'rxjs';

interface Features {
  [key: string]: string | boolean | undefined;
}

const stageFeatures: Features = {
  'demo-kb-id': 'eed07421-dc96-4067-a73b-32c89eac0229',
};

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private stageFeatures = new BehaviorSubject<Features>(stageFeatures);
  private features: Observable<Features> = from(
    fetch('https://nuclia.github.io/status/features.json').then((res) => res.json()),
  ).pipe(shareReplay());

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
}
