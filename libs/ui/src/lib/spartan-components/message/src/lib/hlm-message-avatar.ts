import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmMessageAvatar],hlm-message-avatar',
  host: { 'data-slot': 'message-avatar' },
})
export class HlmMessageAvatar {
  constructor() {
    classes(
      () =>
        'bg-muted min-w-8 rounded-full flex w-fit shrink-0 items-center justify-center self-end overflow-hidden group-has-data-[slot=message-footer]/message:-translate-y-8',
    );
  }
}
