// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, inject } from '@angular/core';
import { BrnResizablePanel } from '@spartan-ng/brain/resizable';

@Directive({
  selector: '[hlmResizablePanel],hlm-resizable-panel',
  exportAs: 'hlmResizablePanel',
  hostDirectives: [
    {
      directive: BrnResizablePanel,
      inputs: ['defaultSize', 'id', 'collapsible', 'maxSize', 'minSize'],
    },
  ],
  host: {
    'data-slot': 'resizable-panel',
  },
})
export class HlmResizablePanel {
  private readonly _resizablePanel = inject(BrnResizablePanel);

  public setSize(size: number) {
    this._resizablePanel.setSize(size);
  }
}
