import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmMessageContent],hlm-message-content',
	host: { 'data-slot': 'message-content' },
})
export class HlmMessageContent {
	constructor() {
		classes(
			() =>
				'gap-2.5 flex w-full min-w-0 flex-col wrap-break-word group-data-[align=end]/message:*:data-slot:self-end',
		);
	}
}
