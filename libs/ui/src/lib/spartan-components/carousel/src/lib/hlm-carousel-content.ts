// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, inject } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { HlmCarousel } from './hlm-carousel';

@Directive({
  selector: '[hlmCarouselContent],hlm-carousel-content',
  exportAs: 'hlmCarouselContent',
  host: {
    'data-slot': 'carousel-content',
  },
})
export class HlmCarouselContent {
  private readonly _orientation = inject(HlmCarousel).orientation;

  constructor() {
    classes(() => [
      'flex',
      this._orientation() === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
    ]);
  }
}
