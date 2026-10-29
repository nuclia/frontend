import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmBubbleGroup],hlm-bubble-group',
	host: { 'data-slot': 'bubble-group' },
})
export class HlmBubbleGroup {
	constructor() {
		classes(() => 'gap-2 flex min-w-0 flex-col');
	}
}
