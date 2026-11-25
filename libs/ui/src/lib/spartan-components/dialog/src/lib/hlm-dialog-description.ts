// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnDialogDescription } from '@spartan-ng/brain/dialog';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmDialogDescription]',
  exportAs: 'hlmDialogDescription',
  hostDirectives: [BrnDialogDescription],
  host: { 'data-slot': 'dialog-description' },
})
export class HlmDialogDescription {
  constructor() {
    classes(
      () =>
        'text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3',
    );
  }
}
