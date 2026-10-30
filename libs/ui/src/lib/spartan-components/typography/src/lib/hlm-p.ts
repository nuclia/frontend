import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

export const hlmP = 'leading-7 [&:not(:first-child)]:mt-6';

@Directive({
  selector: '[hlmP]',
})
export class HlmP {
  constructor() {
    classes(() => hlmP);
  }
}
