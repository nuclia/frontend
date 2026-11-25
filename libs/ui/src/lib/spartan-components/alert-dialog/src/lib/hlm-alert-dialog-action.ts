// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, input } from '@angular/core';
import { HlmButton } from '@progress/pdp-ui-spartan/button';

@Directive({
  selector: 'button[hlmAlertDialogAction]',
  exportAs: 'hlmAlertDialogAction',
  hostDirectives: [{ directive: HlmButton, inputs: ['variant', 'size'] }],
  host: { 'data-slot': 'alert-dialog-action', '[type]': 'type()' },
})
export class HlmAlertDialogAction {
  public readonly type = input<'button' | 'submit' | 'reset'>('button');
}
