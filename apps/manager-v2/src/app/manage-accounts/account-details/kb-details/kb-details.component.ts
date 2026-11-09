import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matCheckRound, matContentCopyRound } from '@ng-icons/material-icons/round';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmDropdownMenuImports } from '@nuclia/ui-spartan/dropdown-menu';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmSwitchImports } from '@nuclia/ui-spartan/switch';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { KbDetailsService } from './kb-details.service';
import { KbMembersComponent } from './kb-members/kb-members.component';

@Component({
  templateUrl: './kb-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSwitchImports,
    NgIcon,
    FormFooterComponent,
    KbMembersComponent,
  ],
  providers: [KbDetailsService, provideIcons({ matCheckRound, matContentCopyRound })],
})
export class KbDetailsComponent {
  protected vm = inject(KbDetailsService);
}
