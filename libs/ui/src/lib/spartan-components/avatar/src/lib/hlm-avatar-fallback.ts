// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAvatarFallback } from '@spartan-ng/brain/avatar';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAvatarFallback]',
  exportAs: 'hlmAvatarFallback',
  hostDirectives: [BrnAvatarFallback],
  host: {
    'data-slot': 'avatar-fallback',
  },
})
export class HlmAvatarFallback {
  constructor() {
    classes(
      () =>
        'bg-muted text-muted-foreground rounded-full flex size-full items-center justify-center text-sm group-data-[size=sm]/avatar:text-xs',
    );
  }
}
