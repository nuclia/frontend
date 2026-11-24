// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, input } from '@angular/core';
import { BrnTabsContent } from '@spartan-ng/brain/tabs';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmTabsContent]',
  exportAs: 'hlmTabsContent',
  hostDirectives: [
    { directive: BrnTabsContent, inputs: ['brnTabsContent: hlmTabsContent'] },
  ],
  host: {
    'data-slot': 'tabs-content',
  },
})
export class HlmTabsContent {
  public readonly contentFor = input.required<string>({
    alias: 'hlmTabsContent',
  });

  constructor() {
    classes(() => 'flex-1 text-sm outline-none');
  }
}
