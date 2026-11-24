// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAvatarGroup],hlm-avatar-group',
  exportAs: 'hlmAvatarGroup',
  host: {
    'data-slot': 'avatar-group',
  },
})
export class HlmAvatarGroup {
  constructor() {
    classes(
      () =>
        '*:data-[slot=avatar]:ring-background group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2',
    );
  }
}
