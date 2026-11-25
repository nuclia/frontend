// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, input } from '@angular/core';
import { BrnTabs } from '@spartan-ng/brain/tabs';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmTabs],hlm-tabs',
  exportAs: 'hlmTabs',
  hostDirectives: [
    {
      directive: BrnTabs,
      inputs: ['orientation', 'activationMode', 'brnTabs: tab'],
      outputs: ['tabActivated'],
    },
  ],
  host: {
    'data-slot': 'tabs',
  },
})
export class HlmTabs {
  public readonly tab = input.required<string>();

  constructor() {
    classes(
      () => 'group/tabs flex gap-2 data-[orientation=horizontal]:flex-col',
    );
  }
}
