// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matChevronRightRound } from '@ng-icons/material-symbols/round';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnCollapsibleTrigger } from '@spartan-ng/brain/collapsible';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[hlmTraceCollapsibleTrigger]',
  exportAs: 'hlmTraceCollapsibleTrigger',
  imports: [NgIcon],
  providers: [provideIcons({ matChevronRightRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: BrnCollapsibleTrigger, inputs: ['type'] }],
  host: { 'data-slot': 'trace-collapsible-trigger' },
  template: `
    <ng-content />
    <ng-icon
      name="matChevronRightRound"
      class="transition-transform group-aria-expanded/trace-collapsible-trigger:rotate-90 motion-reduce:transition-none"
    />
  `,
})
export class HlmTraceCollapsibleTrigger {
  constructor() {
    classes(
      () =>
        'focus-visible:ring-ring/50 gap-1 rounded-md focus-visible:ring-3 group/trace-collapsible-trigger text-muted-foreground hover:text-foreground has-[[data-status=error]]:text-destructive flex w-fit max-w-full min-w-0 cursor-pointer items-center text-left transition-colors outline-none',
    );
  }
}
