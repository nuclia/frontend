// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSwitchThumb } from '@spartan-ng/brain/switch';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSwitchThumb],hlm-switch-thumb',
  exportAs: 'hlmSwitchThumb',
  hostDirectives: [BrnSwitchThumb],
  host: { 'data-slot': 'switch-thumb' },
})
export class HlmSwitchThumb {
  constructor() {
    classes(
      () =>
        'bg-background dark:data-unchecked:bg-foreground dark:data-checked:bg-primary-foreground rounded-full group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-unchecked:translate-x-0 data-checked:ltr:translate-x-[calc(100%-2px)] data-checked:rtl:-translate-x-[calc(100%-2px)] pointer-events-none block ring-0 transition-transform',
    );
  }
}
