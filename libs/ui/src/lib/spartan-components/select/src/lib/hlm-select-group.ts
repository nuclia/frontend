// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSelectGroup } from '@spartan-ng/brain/select';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSelectGroup],hlm-select-group',
  exportAs: 'hlmSelectGroup',
  hostDirectives: [{ directive: BrnSelectGroup }],
  host: { 'data-slot': 'select-group' },
})
export class HlmSelectGroup {
  constructor() {
    classes(() => 'scroll-my-1 p-1');
  }
}
