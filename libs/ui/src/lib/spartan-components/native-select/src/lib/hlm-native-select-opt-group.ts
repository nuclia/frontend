// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'optgroup[hlmNativeSelectOptGroup]',
  exportAs: 'hlmNativeSelectOptGroup',
  host: { 'data-slot': 'native-select-optgroup' },
})
export class HlmNativeSelectOptGroup {
  constructor() {
    classes(() => 'bg-[Canvas] text-[CanvasText]');
  }
}
