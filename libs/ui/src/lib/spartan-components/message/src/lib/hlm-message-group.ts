// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmMessageGroup],hlm-message-group',
  exportAs: 'hlmMessageGroup',
  host: { 'data-slot': 'message-group' },
})
export class HlmMessageGroup {
  constructor() {
    classes(() => 'gap-2 flex min-w-0 flex-col');
  }
}
