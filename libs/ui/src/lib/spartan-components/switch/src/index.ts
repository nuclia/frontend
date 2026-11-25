// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { HlmSwitch } from './lib/hlm-switch';
import { HlmSwitchThumb } from './lib/hlm-switch-thumb';

export * from './lib/hlm-switch';
export * from './lib/hlm-switch-thumb';

export const HlmSwitchImports = [HlmSwitch, HlmSwitchThumb] as const;
