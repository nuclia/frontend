import { ChangeDetectionStrategy, Component, computed, effect, input, output, ViewEncapsulation } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { isRegisteredAgentSubFormModified, selectedNodeData, showRegisteredAgentForm } from '../../workflow.state';
import { RegisteredAgentSubformComponent } from '../registered-agent/registered-agent-subform.component';
import { NodeFunctionsComponent } from '../node-functions/node-functions.component';

@Component({
  selector: 'app-configuration-form',
  imports: [
    NodeFunctionsComponent,
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    PaTextFieldModule,
    RegisteredAgentSubformComponent,
  ],
  templateUrl: './configuration-form.component.html',
  styleUrl: './configuration-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ConfigurationFormComponent {
  form = input.required<FormGroup>();
  submitDisabled = input<boolean | undefined>();

  headerHeight = input();
  submitButton = input('');
  triggerSubmit = output();
  cancel = output();

  showRegisteredAgentForm = showRegisteredAgentForm;
  currentNode = computed(() => selectedNodeData());
  showPublishedFunctions = computed(() => this.currentNode()?.parentLinkType === 'agents');

  constructor() {
    effect(() => {
      if (isRegisteredAgentSubFormModified()) {
        this.form().markAsDirty();
      }
    });
  }
  onSubmit() {
    if (this.form().valid) {
      this.triggerSubmit.emit();
    }
  }
}
