import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnMessageScrollerViewport } from '@spartan-ng/brain/message-scroller';

@Directive({
  selector: '[hlmMessageScrollerViewport],hlm-message-scroller-viewport',
  exportAs: 'hlmMessageScrollerViewport',
  hostDirectives: [
    {
      directive: BrnMessageScrollerViewport,
      inputs: ['preserveScrollOnPrepend', 'aria-label', 'tabindex'],
    },
  ],
  host: {
    'data-slot': 'message-scroller-viewport',
  },
})
export class HlmMessageScrollerViewport {
  constructor() {
    classes(
      () =>
        'scroll-fade-b size-full min-h-0 min-w-0 scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain contain-content data-autoscrolling:scrollbar-thumb-transparent data-autoscrolling:scrollbar-track-transparent',
    );
  }
}
