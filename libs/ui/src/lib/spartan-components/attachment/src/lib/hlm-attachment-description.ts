// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAttachmentDescription],hlm-attachment-description',
  exportAs: 'hlmAttachmentDescription',
  host: { 'data-slot': 'attachment-description' },
})
export class HlmAttachmentDescription {
  constructor() {
    classes(
      () =>
        'text-muted-foreground mt-0.5 truncate text-xs group-data-[state=error]/attachment:text-destructive/80 block max-w-full min-w-0',
    );
  }
}
