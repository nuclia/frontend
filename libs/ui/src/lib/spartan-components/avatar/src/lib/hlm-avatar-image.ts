// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, inject } from '@angular/core';
import { BrnAvatarImage } from '@spartan-ng/brain/avatar';
import { classes } from '@progress/pdp-ui-spartan/utils';

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
