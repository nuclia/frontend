import { Directive } from '@angular/core';
import { BrnAccordion } from '@spartan-ng/brain/accordion';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmAccordion], hlm-accordion',
	hostDirectives: [{ directive: BrnAccordion, inputs: ['type', 'orientation'] }],
	host: {
		'data-slot': 'accordion',
	},
})
export class HlmAccordion {
	constructor() {
		classes(() => 'flex w-full flex-col');
	}
}
