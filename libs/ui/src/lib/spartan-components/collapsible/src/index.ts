// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { HlmCollapsible } from './lib/hlm-collapsible';
import { HlmCollapsibleContent } from './lib/hlm-collapsible-content';
import { HlmCollapsibleTrigger } from './lib/hlm-collapsible-trigger';

export * from './lib/hlm-collapsible';
export * from './lib/hlm-collapsible-content';
export * from './lib/hlm-collapsible-trigger';

export const HlmCollapsibleImports = [
  HlmCollapsible,
  HlmCollapsibleContent,
  HlmCollapsibleTrigger,
] as const;
