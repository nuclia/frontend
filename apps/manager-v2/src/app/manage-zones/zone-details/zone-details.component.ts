import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matArrowBackRound } from '@ng-icons/material-icons/round';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmCheckboxImports } from '@nuclia/ui-spartan/checkbox';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmSelectImports } from '@nuclia/ui-spartan/select';
import { ZoneAccountsComponent } from './zone-accounts/zone-accounts.component';
import { ZoneDetailsService } from './zone-details.service';

@Component({
  templateUrl: './zone-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports,
    NgIcon,
    ZoneAccountsComponent,
  ],
  providers: [ZoneDetailsService, provideIcons({ matArrowBackRound })],
})
export class ZoneDetailsComponent {
  protected vm = inject(ZoneDetailsService);
}
