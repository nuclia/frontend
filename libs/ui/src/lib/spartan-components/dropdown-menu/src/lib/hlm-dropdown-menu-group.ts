// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { CdkMenuGroup } from '@angular/cdk/menu';
import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmDropdownMenuGroup],hlm-dropdown-menu-group',
  exportAs: 'hlmDropdownMenuGroup',
  hostDirectives: [CdkMenuGroup],
  host: { 'data-slot': 'dropdown-menu-group' },
})
export class HlmDropdownMenuGroup {
  constructor() {
    classes(() => 'block');
  }
}
