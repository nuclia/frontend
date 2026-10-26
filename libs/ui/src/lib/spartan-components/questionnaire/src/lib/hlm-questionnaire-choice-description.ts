import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmQuestionnaireChoiceDescription]',
	exportAs: 'hlmQuestionnaireChoiceDescription',
	host: {
		'data-slot': 'questionnaire-choice-description',
	},
})
export class HlmQuestionnaireChoiceDescription {
	constructor() {
		classes(() => 'text-muted-foreground');
	}
}
