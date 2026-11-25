// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { HlmToggleGroup } from './lib/hlm-toggle-group';
import { HlmToggleGroupItem } from './lib/hlm-toggle-group-item';

export * from './lib/hlm-toggle-group';
export * from './lib/hlm-toggle-group-item';
export * from './lib/hlm-toggle-group.token';

export const HlmToggleGroupImports = [
  HlmToggleGroup,
  HlmToggleGroupItem,
] as const;
