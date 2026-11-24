// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnResizableGroup } from '@spartan-ng/brain/resizable';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmResizableGroup],hlm-resizable-group',
  exportAs: 'hlmResizableGroup',
  hostDirectives: [
    {
      directive: BrnResizableGroup,
      inputs: ['direction', 'layout'],
      outputs: ['dragEnd', 'dragStart', 'layoutChange'],
    },
  ],
  host: {
    'data-slot': 'resizable-group',
  },
})
export class HlmResizableGroup {
  constructor() {
    classes(
      () =>
        'group flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
    );
  }
}
