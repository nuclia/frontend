// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnMessageScrollerProvider } from '@spartan-ng/brain/message-scroller';

@Directive({
  selector: '[hlmMessageScrollerProvider]',
  exportAs: 'hlmMessageScrollerProvider',
  hostDirectives: [
    {
      directive: BrnMessageScrollerProvider,
      inputs: [
        'autoScroll',
        'defaultScrollPosition',
        'scrollEdgeThreshold',
        'scrollPreviousItemPeek',
        'scrollMargin',
      ],
    },
  ],
  host: {
    // Match React's Provider (no layout box) so height:100% on the scroller
    // resolves against the real parent (e.g. card content), not this wrapper.
    // Inline style — don't depend on a Tailwind `contents` utility being generated.
    style: 'display: contents',
  },
})
export class HlmMessageScrollerProvider {}
