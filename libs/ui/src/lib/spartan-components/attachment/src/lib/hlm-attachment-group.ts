// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAttachmentGroup],hlm-attachment-group',
  exportAs: 'hlmAttachmentGroup',
  host: { 'data-slot': 'attachment-group' },
})
export class HlmAttachmentGroup {
  constructor() {
    classes(
      () =>
        'scroll-fade-x no-scrollbar flex min-w-0 snap-x snap-mandatory scroll-px-1 gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start',
    );
  }
}
