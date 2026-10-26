import { Directive, input } from '@angular/core';
import { HlmButton } from '@nuclia/ui-spartan/button';

@Directive({
	selector: 'button[hlmAlertDialogAction]',
	hostDirectives: [{ directive: HlmButton, inputs: ['variant', 'size'] }],
	host: { 'data-slot': 'alert-dialog-action', '[type]': 'type()' },
})
export class HlmAlertDialogAction {
	public readonly type = input<'button' | 'submit' | 'reset'>('button');
}
