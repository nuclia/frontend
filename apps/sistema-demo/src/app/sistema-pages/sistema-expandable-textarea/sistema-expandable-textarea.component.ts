
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';

@Component({
  selector: 'nsd-sistema-expandable-textarea',
  imports: [PaDemoModule, ExpandableTextareaComponent],
  templateUrl: './sistema-expandable-textarea.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaExpandableTextareaComponent {
  codeExample = `<nsi-expandable-textarea
  id="prompt"
  formControlName="prompt"
  rows="2"
  resizable
  placeholder="If…"
  help="Provides more clues to extract parameters"
  modalTitle="Extra prompt"
  externalLabel>
  Extra prompt
</nsi-expandable-textarea>`;
}
