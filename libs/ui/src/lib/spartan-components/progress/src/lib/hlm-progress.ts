// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnProgress } from '@spartan-ng/brain/progress';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'hlm-progress,[hlmProgress]',
  exportAs: 'hlmProgress',
  hostDirectives: [
    { directive: BrnProgress, inputs: ['value', 'max', 'getValueLabel'] },
  ],
  host: { 'data-slot': 'progress' },
})
export class HlmProgress {
  constructor() {
    classes(
      () =>
        'bg-muted h-1 rounded-full relative inline-flex w-full overflow-hidden',
    );
  }
}
