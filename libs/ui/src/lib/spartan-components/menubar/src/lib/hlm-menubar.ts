// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { CdkMenuBar } from '@angular/cdk/menu';
import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmMenubar],hlm-menubar',
  exportAs: 'hlmMenubar',
  hostDirectives: [CdkMenuBar],
  host: {
    'data-slot': 'menubar',
  },
})
export class HlmMenubar {
  constructor() {
    classes(
      () =>
        'bg-background h-8 gap-0.5 rounded-lg border p-[3px] flex items-center',
    );
  }
}
