import { InjectionToken, type ValueProvider, inject } from '@angular/core';
import type { UiStepperIndicatorMode } from './ui-step-header';

export interface UiStepperConfig {
  animationEnabled: boolean;
  animationDuration: number;
  defaultIndicatorMode: UiStepperIndicatorMode;
}

const defaultConfig: UiStepperConfig = {
  animationEnabled: true,
  animationDuration: 300,
  defaultIndicatorMode: 'state',
};

const UiStepperConfigToken = new InjectionToken<UiStepperConfig>('uiStepperConfig');

function normalizeDuration(duration: number): number {
  if (!Number.isFinite(duration)) {
    return defaultConfig.animationDuration;
  }

  return Math.max(0, Math.round(duration));
}

export function provideUiStepperConfig(config: Partial<UiStepperConfig>): ValueProvider {
  const mergedConfig = { ...defaultConfig, ...config };
  return {
    provide: UiStepperConfigToken,
    useValue: { ...mergedConfig, animationDuration: normalizeDuration(mergedConfig.animationDuration) },
  };
}

export function injectUiStepperConfig(): UiStepperConfig {
  const config = inject(UiStepperConfigToken, { optional: true }) ?? defaultConfig;
  return { ...config, animationDuration: normalizeDuration(config.animationDuration) };
}
