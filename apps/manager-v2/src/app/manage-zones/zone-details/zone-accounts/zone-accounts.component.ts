import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matDeleteRound } from '@ng-icons/material-icons/round';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { ZoneAccountEntry } from '../../zone.models';
import { ZoneService } from '../../zone.service';

@Component({
  selector: 'app-zone-accounts',
  templateUrl: './zone-accounts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, HlmButtonImports, HlmFieldImports, HlmInputImports, NgIcon],
  providers: [provideIcons({ matDeleteRound })],
})
export class ZoneAccountsComponent {
  private zoneService = inject(ZoneService);
  private toast = inject(UiToastService);

  zoneId = input.required<string>();

  protected grantedAccounts = signal<ZoneAccountEntry[]>([]);
  protected newAccountId = signal('');
  protected isGranting = signal(false);

  constructor() {
    effect(() => {
      const zoneId = this.zoneId();
      if (zoneId) {
        untracked(() => this.loadGrantedAccounts());
      }
    });
  }

  protected grantAccount() {
    const accountId = this.newAccountId().trim();
    if (!accountId || !this.zoneId()) return;
    this.isGranting.set(true);
    this.zoneService.grantZoneToAccount(this.zoneId(), accountId).subscribe({
      next: () => {
        this.newAccountId.set('');
        this.isGranting.set(false);
        this.loadGrantedAccounts();
      },
      error: () => {
        this.isGranting.set(false);
        this.toast.error('Failed to grant account access');
      },
    });
  }

  protected revokeAccount(accountId: string) {
    if (!this.zoneId()) return;
    this.zoneService.revokeZoneFromAccount(this.zoneId(), accountId).subscribe({
      next: () => this.loadGrantedAccounts(),
      error: () => this.toast.error('Failed to revoke account access'),
    });
  }

  private loadGrantedAccounts() {
    this.zoneService.getZoneAccounts(this.zoneId()).subscribe({
      next: (accounts) => this.grantedAccounts.set(accounts),
      error: () => this.toast.error('Failed to load granted accounts'),
    });
  }
}
