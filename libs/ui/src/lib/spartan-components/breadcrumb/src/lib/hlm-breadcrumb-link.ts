// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmBreadcrumbLink]',
  exportAs: 'hlmBreadcrumbLink',
  hostDirectives: [
    {
      directive: RouterLink,
      inputs: [
        'target',
        'queryParams',
        'fragment',
        'queryParamsHandling',
        'state',
        'info',
        'relativeTo',
        'preserveFragment',
        'skipLocationChange',
        'replaceUrl',
        'routerLink: link',
      ],
    },
  ],
  host: {
    'data-slot': 'breadcrumb-link',
  },
})
export class HlmBreadcrumbLink {
  /** The link to navigate to the page. */
  public readonly link = input<RouterLink['routerLink']>();

  constructor() {
    classes(() => 'hover:text-foreground transition-colors');
  }
}
