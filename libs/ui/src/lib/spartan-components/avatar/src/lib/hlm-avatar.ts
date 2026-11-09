import { Directive, input } from '@angular/core';
import { BrnAvatar } from '@spartan-ng/brain/avatar';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmAvatar],hlm-avatar',
  exportAs: 'hlmAvatar',
  hostDirectives: [BrnAvatar],
  host: {
    'data-slot': 'avatar',
    '[attr.data-size]': 'size()',
  },
})
export class HlmAvatar {
  public readonly size = input<'default' | 'sm' | 'lg'>('default');

  constructor() {
    classes(
      () =>
        'size-8 rounded-full after:rounded-full data-[size=lg]:size-10 data-[size=sm]:size-6 group/avatar after:border-border relative flex shrink-0 select-none after:absolute after:inset-0 after:border after:mix-blend-darken dark:after:mix-blend-lighten',
    );
  }
}
