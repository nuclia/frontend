// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnNavigationMenuItem } from '@spartan-ng/brain/navigation-menu';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'li[hlmNavigationMenuItem]',
  exportAs: 'hlmNavigationMenuItem',
  hostDirectives: [{ directive: BrnNavigationMenuItem, inputs: ['id'] }],
  host: {
    'data-slot': 'navigation-menu-item',
  },
})
export class HlmNavigationMenuItem {
  constructor() {
    classes(() => 'relative has-[:focus]:z-10 data-active:z-10');
  }
}
