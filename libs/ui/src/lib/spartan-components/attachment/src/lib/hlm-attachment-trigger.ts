// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { computed, Directive, ElementRef, inject, input } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'button[hlmAttachmentTrigger],a[hlmAttachmentTrigger]',
  exportAs: 'hlmAttachmentTrigger',
  host: {
    'data-slot': 'attachment-trigger',
    '[attr.type]': '_hostType()',
  },
})
export class HlmAttachmentTrigger {
  private readonly _elementRef = inject(ElementRef<HTMLElement>);

  public readonly type = input<'button' | 'submit' | 'reset' | null>('button');

  protected readonly _hostType = computed(() =>
    this._elementRef.nativeElement.localName === 'button' ? this.type() : null,
  );

  constructor() {
    classes(() => 'absolute inset-0 z-10 outline-none');
  }
}
