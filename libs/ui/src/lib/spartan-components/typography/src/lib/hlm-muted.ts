import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

export const hlmMuted = 'text-sm text-muted-foreground';

@Directive({
  selector: '[hlmMuted]',
  exportAs: 'hlmMuted',
})
export class HlmMuted {
  constructor() {
    classes(() => hlmMuted);
  }
}
