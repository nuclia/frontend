// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnHoverCardTrigger } from '@spartan-ng/brain/hover-card';

@Directive({
  selector: '[hlmHoverCardTrigger]',
  exportAs: 'hlmHoverCardTrigger',
  hostDirectives: [
    {
      directive: BrnHoverCardTrigger,
      inputs: [
        'showDelay',
        'hideDelay',
        'animationDelay',
        'sideOffset',
        'align',
        'brnHoverCardTriggerFor: hlmHoverCardTriggerFor',
      ],
    },
  ],
  host: {
    'data-slot': 'hover-card-trigger',
  },
})
export class HlmHoverCardTrigger {}
