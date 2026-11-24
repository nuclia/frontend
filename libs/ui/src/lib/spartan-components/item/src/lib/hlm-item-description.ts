// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmItemDescription],hlm-item-description',
  exportAs: 'hlmItemDescription',
  host: { 'data-slot': 'item-description' },
})
export class HlmItemDescription {
  constructor() {
    classes(
      () =>
        'text-muted-foreground text-start text-sm leading-normal group-data-[size=xs]/item:text-xs [&>a:hover]:text-primary line-clamp-2 flex font-normal [&>a]:underline [&>a]:underline-offset-4',
    );
  }
}
