// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmItemGroup],hlm-item-group',
  exportAs: 'hlmItemGroup',
  host: { 'data-slot': 'item-group' },
})
export class HlmItemGroup {
  constructor() {
    classes(
      () =>
        'gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2 group/item-group flex w-full flex-col',
    );
  }
}
