// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnCommandList } from '@spartan-ng/brain/command';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCommandList],hlm-command-list',
  exportAs: 'hlmCommandList',
  hostDirectives: [
    {
      directive: BrnCommandList,
      inputs: ['id'],
    },
  ],
  host: {
    'data-slot': 'command-list',
  },
})
export class HlmCommandList {
  constructor() {
    classes(
      () =>
        'no-scrollbar max-h-72 scroll-py-1 outline-none overflow-x-hidden overflow-y-auto',
    );
  }
}
