import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmMessageHeader],hlm-message-header',
  host: { 'data-slot': 'message-header' },
})
export class HlmMessageHeader {
  constructor() {
    classes(
      () =>
        'text-muted-foreground px-3 text-xs font-medium flex max-w-full min-w-0 items-center group-has-data-[variant=ghost]/message:px-0',
    );
  }
}
