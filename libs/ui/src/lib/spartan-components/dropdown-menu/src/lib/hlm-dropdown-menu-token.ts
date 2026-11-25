// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { InjectionToken, type ValueProvider, inject } from '@angular/core';
import { type MenuAlign, type MenuSide } from '@spartan-ng/brain/core';

export interface HlmDropdownMenuConfig {
  align: MenuAlign;
  side: MenuSide;
}

const defaultConfig: HlmDropdownMenuConfig = {
  align: 'start',
  side: 'bottom',
};

const HlmDropdownMenuConfigToken = new InjectionToken<HlmDropdownMenuConfig>(
  'HlmDropdownMenuConfig',
);

export function provideHlmDropdownMenuConfig(
  config: Partial<HlmDropdownMenuConfig>,
): ValueProvider {
  return {
    provide: HlmDropdownMenuConfigToken,
    useValue: { ...defaultConfig, ...config },
  };
}

export function injectHlmDropdownMenuConfig(): HlmDropdownMenuConfig {
  return (
    inject(HlmDropdownMenuConfigToken, { optional: true }) ?? defaultConfig
  );
}
