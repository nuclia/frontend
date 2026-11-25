// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmMessageAvatar],hlm-message-avatar',
  exportAs: 'hlmMessageAvatar',
  host: { 'data-slot': 'message-avatar' },
})
export class HlmMessageAvatar {
  constructor() {
    classes(
      () =>
        'bg-muted min-w-8 rounded-full flex w-fit shrink-0 items-center justify-center self-end overflow-hidden group-has-data-[slot=message-footer]/message:-translate-y-8',
    );
  }
}
