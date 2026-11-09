import { Directive, inject } from '@angular/core';
import { BrnHoverCardContentService } from '@spartan-ng/brain/hover-card';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmHoverCardContent],hlm-hover-card-content',
  exportAs: 'hlmHoverCardContent',
  host: {
    'data-slot': 'hover-card-content',
    '[attr.data-state]': 'state()',
    '[attr.data-side]': 'side()',
  },
})
export class HlmHoverCardContent {
  private readonly _contentService = inject(BrnHoverCardContentService);

  public readonly state = this._contentService.state;
  public readonly side = this._contentService.side;

  constructor() {
    classes(() => [
      'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground w-64 rounded-lg p-2.5 text-sm shadow-md ring-1 duration-100 z-50 outline-none',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
    ]);
  }
}
