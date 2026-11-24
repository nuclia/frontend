// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { InjectionToken, type ValueProvider, inject } from '@angular/core';
import { type MenuAlign, type MenuSide } from '@spartan-ng/brain/core';

export interface HlmContextMenuConfig {
  align: MenuAlign;
  side: MenuSide;
}

const defaultConfig: HlmContextMenuConfig = {
  align: 'start',
  side: 'bottom',
};

const HlmContextMenuConfigToken = new InjectionToken<HlmContextMenuConfig>(
  'HlmContextMenuConfig',
);

export function provideHlmContextMenuConfig(
  config: Partial<HlmContextMenuConfig>,
): ValueProvider {
  return {
    provide: HlmContextMenuConfigToken,
    useValue: { ...defaultConfig, ...config },
  };
}

export function injectHlmContextMenuConfig(): HlmContextMenuConfig {
  return inject(HlmContextMenuConfigToken, { optional: true }) ?? defaultConfig;
}
