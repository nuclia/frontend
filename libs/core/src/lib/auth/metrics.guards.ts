import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { map, first } from 'rxjs';
import { FeaturesService } from '../analytics';

export const metricsEnabledGuard: CanMatchFn = () =>
  inject(FeaturesService).unstable.metrics.pipe(
    first(),
    map((enabled) => enabled),
  );

export const metricsDisabledGuard: CanMatchFn = () =>
  inject(FeaturesService).unstable.metrics.pipe(
    first(),
    map((enabled) => !enabled),
  );
