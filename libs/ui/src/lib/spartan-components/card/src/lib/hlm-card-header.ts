// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCardHeader],hlm-card-header',
  exportAs: 'hlmCardHeader',
  host: { 'data-slot': 'card-header' },
})
export class HlmCardHeader {
  constructor() {
    classes(
      () =>
        'gap-1 rounded-t-xl px-(--card-spacing) [.border-b]:pb-(--card-spacing) group/card-header @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]',
    );
  }
}
