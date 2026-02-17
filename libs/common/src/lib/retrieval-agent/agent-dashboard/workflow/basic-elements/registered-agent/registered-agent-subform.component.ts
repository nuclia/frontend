import { Component, effect, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AccordionBodyDirective, AccordionItemComponent, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { registeredAgentParams } from '../../workflow.state';

@Component({
  selector: 'app-registered-agent-subform',
  templateUrl: 'registered-agent-subform.component.html',
  imports: [PaTextFieldModule, ReactiveFormsModule, TranslateModule, AccordionBodyDirective, AccordionItemComponent],
})
export class RegisteredAgentSubformComponent implements OnInit {
  expanded = true;
  form = new FormGroup({
    description: new FormControl<string>('', { nonNullable: true }),
    functions: new FormControl<string[]>([], { nonNullable: true }),
  });

  constructor() {
    effect(() => this.form.patchValue({ description: registeredAgentParams().description }, { emitEvent: false }));
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe((values) => {
      registeredAgentParams.set({ description: values.description || '', functions: [], modified: true });
    });
  }
}
