import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matWarningRound } from '@ng-icons/material-icons/round';
import { NucliaTokensMetric } from '@nuclia/core';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertImports } from '@nuclia/ui-spartan/alert';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmDatePickerImports } from '@nuclia/ui-spartan/date-picker';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmTabsImports } from '@nuclia/ui-spartan/tabs';
import { isBefore, isFuture, subDays } from 'date-fns';
import { filter, map, switchMap, take } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import { TokenConsumptionTableComponent } from './token-consumption-table/token-consumption-table.component';
import { DIGITS_INFO, isInvalidHour, toIsoDate } from './token-consumption.utils';

@Component({
  selector: 'nma-token-consumption',
  imports: [
    DecimalPipe,
    FormsModule,
    NgIcon,
    HlmAlertImports,
    HlmButtonImports,
    HlmDatePickerImports,
    HlmInputImports,
    HlmTabsImports,
    TokenConsumptionTableComponent,
  ],
  providers: [provideIcons({ matWarningRound })],
  templateUrl: './token-consumption.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenConsumptionComponent {
  private service = inject(AccountService);
  private store = inject(ManagerStore);

  private account$ = toObservable(this.store.accountDetails);
  kbList = this.store.kbList;

  tokenConsumption = signal<NucliaTokensMetric | null>(null);
  selectedTab = 'account';
  digitsInfo = DIGITS_INFO;

  toDate?: Date;
  toTime: number;
  fromDate?: Date;
  fromTime: number;
  kbId?: string;

  backup: { from: string; to: string };

  constructor() {
    const now = new Date();

    // Range initialised with last 24h
    this.toDate = now;
    this.toTime = now.getHours();

    const from = subDays(now, 1);
    this.fromDate = from;
    this.fromTime = from.getHours();

    this.backup = {
      from: `${this.from}`,
      to: `${this.to}`,
    };

    this.loadTokenConsumption();
  }

  loadTokenConsumption() {
    this.account$
      .pipe(
        filter((account) => !!account),
        take(1),
        map((accountDetails) => (accountDetails as AccountDetails).id),
        switchMap((accountId) => this.service.loadTokenConsumption(accountId, this.from, this.to, this.kbId)),
      )
      .subscribe({
        next: (nucliaTokens) => this.tokenConsumption.set(nucliaTokens),
        error: (error) => {
          toast.error(`An error occurred while loading token consumption: <strong>${error}</strong>`);
          this.tokenConsumption.set(null);
        },
      });
  }

  changeTab(tab: string) {
    this.selectedTab = tab;
    this.kbId = tab === 'account' ? undefined : tab;
    this.loadTokenConsumption();
  }

  get from() {
    return toIsoDate(this.fromDate, this.fromTime);
  }

  get to() {
    return toIsoDate(this.toDate, this.toTime);
  }
  get fromInFuture() {
    return isFuture(this.from);
  }
  get invalidFromTime() {
    return isInvalidHour(this.fromTime);
  }
  get invalidToTime() {
    return isInvalidHour(this.toTime);
  }
  get isNotModified() {
    return this.backup.from === this.from && this.backup.to === this.to;
  }
  get invalidRange() {
    return isBefore(this.to, this.from);
  }
  get invalidForm() {
    return (
      !this.from || !this.to || this.fromInFuture || this.invalidFromTime || this.invalidToTime || this.invalidRange
    );
  }
}
