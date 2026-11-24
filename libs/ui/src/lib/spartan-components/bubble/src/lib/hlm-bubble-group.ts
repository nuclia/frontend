// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmBubbleGroup],hlm-bubble-group',
  exportAs: 'hlmBubbleGroup',
  host: { 'data-slot': 'bubble-group' },
})
export class HlmBubbleGroup {
  constructor() {
    classes(() => 'gap-2 flex min-w-0 flex-col');
  }
}
