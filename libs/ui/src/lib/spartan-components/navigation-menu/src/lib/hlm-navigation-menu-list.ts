// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnNavigationMenuList } from '@spartan-ng/brain/navigation-menu';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'ul[hlmNavigationMenuList]',
  exportAs: 'hlmNavigationMenuList',
  hostDirectives: [
    {
      directive: BrnNavigationMenuList,
    },
  ],
  host: {
    'data-slot': 'navigation-menu-list',
  },
})
export class HlmNavigationMenuList {
  constructor() {
    classes(() => [
      'gap-0 group flex flex-1 list-none items-center justify-center',
      'data-[orientation=vertical]:flex-col',
    ]);
  }
}
