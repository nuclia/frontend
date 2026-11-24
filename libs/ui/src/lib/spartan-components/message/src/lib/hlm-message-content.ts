// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmMessageContent],hlm-message-content',
  exportAs: 'hlmMessageContent',
  host: { 'data-slot': 'message-content' },
})
export class HlmMessageContent {
  constructor() {
    classes(
      () =>
        'gap-2.5 flex w-full min-w-0 flex-col wrap-break-word group-data-[align=end]/message:*:data-slot:self-end',
    );
  }
}
