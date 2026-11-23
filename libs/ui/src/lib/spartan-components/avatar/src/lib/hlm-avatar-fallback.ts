import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnAvatarFallback } from '@spartan-ng/brain/avatar';

@Directive({
  selector: '[hlmAvatarFallback]',
  exportAs: 'hlmAvatarFallback',
  hostDirectives: [BrnAvatarFallback],
  host: {
    'data-slot': 'avatar-fallback',
  },
})
export class HlmAvatarFallback {
  constructor() {
    classes(
      () =>
        'bg-muted text-muted-foreground rounded-full flex size-full items-center justify-center text-sm group-data-[size=sm]/avatar:text-xs',
    );
  }
}
