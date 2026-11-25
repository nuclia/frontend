// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnMessageScrollerContent } from '@spartan-ng/brain/message-scroller';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmMessageScrollerContent],hlm-message-scroller-content',
  exportAs: 'hlmMessageScrollerContent',
  hostDirectives: [
    {
      directive: BrnMessageScrollerContent,
      inputs: ['aria-relevant', 'spacerClassName'],
    },
  ],
  host: {
    'data-slot': 'message-scroller-content',
  },
})
export class HlmMessageScrollerContent {
  constructor() {
    classes(() => 'gap-6 flex h-max min-h-full flex-col');
  }
}
