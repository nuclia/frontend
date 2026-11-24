// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnNavigationMenu } from '@spartan-ng/brain/navigation-menu';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'nav[hlmNavigationMenu]',
  exportAs: 'hlmNavigationMenu',
  hostDirectives: [
    {
      directive: BrnNavigationMenu,
      inputs: [
        'value',
        'delayDuration',
        'skipDelayDuration',
        'orientation',
        'openOn',
      ],
      outputs: ['valueChange'],
    },
  ],
  host: {
    'data-slot': 'navigation-menu',
  },
})
export class HlmNavigationMenu {
  constructor() {
    classes(
      () =>
        'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
    );
  }
}
