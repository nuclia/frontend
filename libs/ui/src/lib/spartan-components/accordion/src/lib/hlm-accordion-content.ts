import { ChangeDetectionStrategy, Component } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnAccordionContent } from '@spartan-ng/brain/accordion';

@Component({
  selector: 'hlm-accordion-content',
  exportAs: 'hlmAccordionContent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: BrnAccordionContent, inputs: ['style'] }],
  host: {
    'data-slot': 'accordion-content',
  },
  template: `
    <div
      class="pt-0 pb-2.5 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4">
      <ng-content />
    </div>
  `,
})
export class HlmAccordionContent {
  constructor() {
    classes(
      () => 'text-sm transition-all data-[state=closed]:h-0 data-[state=open]:h-(--brn-accordion-content-height)',
    );
  }
}
