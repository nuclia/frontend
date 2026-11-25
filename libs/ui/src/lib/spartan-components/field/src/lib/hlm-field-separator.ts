// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmSeparator } from '@progress/pdp-ui-spartan/separator';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Component({
  selector: 'hlm-field-separator',
  exportAs: 'hlmFieldSeparator',
  imports: [HlmSeparator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'field-separator' },
  template: `
    <hlm-separator class="absolute inset-0 top-1/2" />
    <span
      data-slot="field-separator-content"
      class="text-muted-foreground px-2 bg-background relative mx-auto block w-fit"
    >
      <ng-content />
    </span>
  `,
})
export class HlmFieldSeparator {
  constructor() {
    classes(
      () =>
        '-my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2 relative',
    );
  }
}
