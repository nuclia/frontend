// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, input } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmPagination],hlm-pagination',
  exportAs: 'hlmPagination',
  host: {
    'data-slot': 'pagination',
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class HlmPagination {
  /** The aria-label for the pagination component. */
  public readonly ariaLabel = input<string>('pagination', {
    alias: 'aria-label',
  });

  constructor() {
    classes(() => 'mx-auto flex w-full justify-center');
  }
}
