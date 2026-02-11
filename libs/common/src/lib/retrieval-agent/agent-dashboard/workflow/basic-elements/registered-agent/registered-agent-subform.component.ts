import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-registered-agent-subform',
  templateUrl: 'registered-agent-subform.component.html',
  imports: [PaTextFieldModule, ReactiveFormsModule, TranslateModule],
})
export class RegisteredAgentSubformComponent {
  form = new FormGroup({
    description: new FormControl<string>('', { nonNullable: true }),
  });
}
