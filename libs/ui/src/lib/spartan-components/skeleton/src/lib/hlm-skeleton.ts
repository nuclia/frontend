import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmSkeleton],hlm-skeleton',
  exportAs: 'hlmSkeleton',
  host: {
    'data-slot': 'skeleton',
  },
})
export class HlmSkeleton {
  constructor() {
    classes(() => 'bg-muted rounded-md block motion-safe:animate-pulse');
  }
}
