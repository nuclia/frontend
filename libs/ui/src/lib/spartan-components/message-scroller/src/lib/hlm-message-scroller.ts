// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnMessageScrollerRoot } from '@spartan-ng/brain/message-scroller';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmMessageScroller],hlm-message-scroller',
  exportAs: 'hlmMessageScroller',
  hostDirectives: [{ directive: BrnMessageScrollerRoot }],
  host: {
    'data-slot': 'message-scroller',
  },
})
export class HlmMessageScroller {
  constructor() {
    classes(
      () =>
        'group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden',
    );
  }
}
