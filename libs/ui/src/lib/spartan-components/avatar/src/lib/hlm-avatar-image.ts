import { Directive, inject } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnAvatarImage } from '@spartan-ng/brain/avatar';

@Directive({
  selector: 'img[hlmAvatarImage]',
  exportAs: 'hlmAvatarImage',
  hostDirectives: [{ directive: BrnAvatarImage, inputs: ['hostStyles'] }],
  host: {
    'data-slot': 'avatar-image',
  },
})
export class HlmAvatarImage {
  public readonly canShow = inject(BrnAvatarImage).canShow;

  constructor() {
    classes(() => 'rounded-full aspect-square size-full object-cover');
  }
}
