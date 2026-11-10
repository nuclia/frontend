import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matMoreVertRound, matPersonAddRound } from '@ng-icons/material-icons/round';
import { UiOptionWithDescription } from '@nuclia/ui/option-with-description';
import { HlmAutocompleteImports } from '@nuclia/ui-spartan/autocomplete';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmDropdownMenuImports } from '@nuclia/ui-spartan/dropdown-menu';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { KbDetails } from '../../../account-ui.models';
import { KbDetailsService } from '../kb-details.service';
import { getUserRows } from '../kb-details.utils';

@Component({
  selector: 'app-kb-members',
  templateUrl: './kb-members.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmAutocompleteImports,
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmFieldImports,
    HlmTableImports,
    NgIcon,
    UiOptionWithDescription,
  ],
  providers: [provideIcons({ matMoreVertRound, matPersonAddRound })],
})
export class KbMembersComponent {
  kb = input.required<KbDetails>();

  protected vm = inject(KbDetailsService);
  protected rows = computed(() => getUserRows(this.kb()));
}
