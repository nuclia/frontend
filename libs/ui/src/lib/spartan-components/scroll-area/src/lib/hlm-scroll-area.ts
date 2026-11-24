// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { provideScrollbarOptions } from 'ngx-scrollbar';

@Directive({
  selector: 'ng-scrollbar[hlm],ng-scrollbar[hlmScrollbar]',
  exportAs: 'hlmScrollArea',
  providers: [provideScrollbarOptions({ visibility: 'hover' })],
  host: {
    'data-slot': 'scroll-area',
    '[style.--scrollbar-thumb-color]': '"var(--border)"',
    '[style.--scrollbar-thumb-hover-color]': '"var(--border)"',
    '[style.--scrollbar-track-color]': '"transparent"',
    '[style.--scrollbar-track-thickness]': '"0.625rem"',
    '[style.--scrollbar-track-offset]': '"1.5px"',
  },
})
export class HlmScrollArea {
  constructor() {
    classes(() => 'rounded-md [--scrollbar-thumb-shape:9999px] block');
  }
}
