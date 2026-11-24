// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'main[hlmSidebarInset]',
  exportAs: 'hlmSidebarInset',
  host: { 'data-slot': 'sidebar-inset' },
})
export class HlmSidebarInset {
  constructor() {
    classes(
      () =>
        'bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ms-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-2 relative flex w-full flex-1 flex-col',
    );
  }
}
