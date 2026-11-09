import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmMessageGroup],hlm-message-group',
  exportAs: 'hlmMessageGroup',
  host: { 'data-slot': 'message-group' },
})
export class HlmMessageGroup {
  constructor() {
    classes(() => 'gap-2 flex min-w-0 flex-col');
  }
}
