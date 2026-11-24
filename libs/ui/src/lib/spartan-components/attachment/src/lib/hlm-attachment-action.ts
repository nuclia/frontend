// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, input } from '@angular/core';
import {
  HlmButton,
  provideBrnButtonConfig,
} from '@progress/pdp-ui-spartan/button';

@Directive({
  selector: 'button[hlmAttachmentAction]',
  exportAs: 'hlmAttachmentAction',
  providers: [provideBrnButtonConfig({ variant: 'ghost', size: 'icon-xs' })],
  hostDirectives: [{ directive: HlmButton, inputs: ['variant', 'size'] }],
  host: {
    'data-slot': 'attachment-action',
    '[type]': 'type()',
  },
})
export class HlmAttachmentAction {
  public readonly type = input<'button' | 'submit' | 'reset'>('button');
}
