import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmAlertDialogFooter],hlm-alert-dialog-footer',
	host: { 'data-slot': 'alert-dialog-footer' },
})
export class HlmAlertDialogFooter {
	constructor() {
		classes(
			() =>
				'bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end',
		);
	}
}
