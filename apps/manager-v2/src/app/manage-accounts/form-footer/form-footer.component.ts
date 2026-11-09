import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { ManagerStore } from '../../manager.store';

@Component({
  selector: 'nma-form-footer',
  templateUrl: './form-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports],
})
export class FormFooterComponent {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly secondary = input(false, { transform: booleanAttribute });
  readonly footerCancel = output<void>();

  protected readonly canEdit = inject(ManagerStore).canEdit;
}
