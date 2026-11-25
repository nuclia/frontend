// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnHoverCard } from '@spartan-ng/brain/hover-card';

@Directive({
  selector: '[hlmHoverCard],hlm-hover-card',
  exportAs: 'hlmHoverCard',
  hostDirectives: [BrnHoverCard],
  host: {
    'data-slot': 'hover-card',
  },
})
export class HlmHoverCard {}
