import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HlmAccordionImports } from '@nuclia/ui-spartan/accordion';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { ComposeService } from '../compose.service';

@Component({
  selector: 'nma-personalization-help',
  templateUrl: './personalization-help.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmAccordionImports, HlmButtonImports],
})
export class PersonalizationHelpComponent {
  protected compose = inject(ComposeService);

  readonly placeholders = [
    { label: 'Insert name', snippet: '{{ user_name }}' },
    { label: 'Insert email', snippet: '{{ user_email }}' },
  ];
  readonly personalizationExamples = [
    { code: '{{ user_name }}', result: 'Anna Smith', description: 'The recipient’s name.' },
    { code: '{{ user_email }}', result: 'anna@example.com', description: 'The recipient’s email address.' },
    { code: '{{ user_name | upper }}', result: 'ANNA SMITH', description: 'Upper case. Use lower for lower case.' },
    {
      code: '{{ user_name | title }}',
      result: 'Anna Smith',
      description: 'Capitalizes every word, useful if names are stored in lower case.',
    },
    {
      code: '{{ user_name | default("there") }}',
      result: 'there',
      description: 'Fallback text when the user has no name, e.g. “Hello there”.',
    },
  ];
}
