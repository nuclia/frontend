// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { BrnCollapsibleContent } from '@spartan-ng/brain/collapsible';
import { classes, hlm } from '@progress/pdp-ui-spartan/utils';
import { ClassValue } from 'clsx';

@Component({
  selector: 'hlm-trace-collapsible-content',
  exportAs: 'hlmTraceCollapsibleContent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: BrnCollapsibleContent, inputs: ['id'] }],
  host: { 'data-slot': 'trace-collapsible-content' },
  template: `
    <div
      [class]="_computedContentInnerClasses()"
      data-slot="trace-collapsible-content-inner"
    >
      <ng-content />
    </div>
  `,
})
export class HlmTraceCollapsibleContent {
  public readonly contentInnerClasses = input<ClassValue>();

  protected readonly _computedContentInnerClasses = computed(() =>
    hlm(
      'mt-2 mb-1 ml-[calc(--spacing(2)-1px)] border-l pr-1 pl-4 leading-relaxed text-muted-foreground min-w-0 wrap-break-word',
      this.contentInnerClasses(),
    ),
  );

  constructor() {
    classes(
      () =>
        'duration-200 block min-w-0 overflow-hidden transition-[height] data-[state=closed]:h-0 data-[state=open]:h-(--brn-collapsible-content-height) motion-reduce:transition-none',
    );
  }
}
