// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, input } from '@angular/core';

@Directive({
  selector: '[hlmBreadcrumb]',
  exportAs: 'hlmBreadcrumb',
  host: {
    'data-slot': 'breadcrumb',
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class HlmBreadcrumb {
  public readonly ariaLabel = input<string>('breadcrumb', {
    alias: 'aria-label',
  });
}
