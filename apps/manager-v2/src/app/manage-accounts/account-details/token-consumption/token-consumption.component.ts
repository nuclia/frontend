import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PaButtonModule,
  PaDatePickerModule,
  PaDropdownModule,
  PaTableModule,
  PaTabsModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent, InfoCardComponent, SisToastService } from '@nuclia/sistema';
import { NucliaTokensMetric } from '@nuclia/core';
import { isBefore, isFuture, subDays } from 'date-fns';
import { AccountService } from '../../account.service';
import { ManagerStore } from '../../../manager.store';
import { BehaviorSubject, filter, map, switchMap, take } from 'rxjs';
import { AccountDetails } from '../../account-ui.models';

@Component({
  selector: 'nma-token-consumption',
  standalone: true,
  imports: [
    CommonModule,
    PaTableModule,
    DropdownButtonComponent,
    PaDropdownModule,
    PaDatePickerModule,
    PaTextFieldModule,
    InfoCardComponent,
    PaButtonModule,
    PaTabsModule,
  ],
  templateUrl: './token-consumption.component.html',
  styleUrl: './token-consumption.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenConsumptionComponent implements OnInit {
  private service = inject(AccountService);
  private store = inject(ManagerStore);
  private toaster = inject(SisToastService);

  account = this.store.accountDetails;
  kbList = this.store.kbList;

  tokenConsumption = new BehaviorSubject<NucliaTokensMetric | null>(null);
  selectedTab = 'account';

  toDate: string;
  toTime: number;
  fromDate: string;
  fromTime: number;
  kbId?: string;

  backup: { from: string; to: string };

  constructor() {
    const now = new Date();

    // Range initialised with last 24h
    this.toDate = now.toISOString();
    this.toTime = now.getHours();

    const from = subDays(now, 1);
    this.fromDate = from.toISOString();
    this.fromTime = from.getHours();

    this.backup = {
      from: `${this.from}`,
      to: `${this.to}`,
    };
  }

  ngOnInit() {
    // this.loadTokenConsumption();
  }

  loadTokenConsumption() {
    this.account
      .pipe(
        filter((account) => !!account),
        take(1),
        map((accountDetails) => (accountDetails as AccountDetails).id),
        switchMap((accountId) => this.service.loadTokenConsumption(accountId, this.from, this.to, this.kbId)),
      )
      .subscribe({
        next: (nucliaTokens) => this.tokenConsumption.next(nucliaTokens),
        error: (error) => {
          this.toaster.error(`An error occurred while loading token consumption: <strong>${error}</strong>`);
          this.tokenConsumption.next(null);
        },
      });
  }

  changeTab(tab: string) {
    this.selectedTab = tab;
    this.kbId = tab !== 'account' ? tab : undefined;
    this.loadTokenConsumption();
  }

  get from() {
    if (this.invalidFromTime) {
      return '';
    }
    const formattedTime = `${this.fromTime < 10 ? '0' : ''}${this.fromTime}:00:00`;
    const timestamp = `${this.fromDate.split('T')[0]}T${formattedTime}`;
    return new Date(timestamp).toISOString();
  }

  get to() {
    if (this.invalidToTime) {
      return '';
    }
    const formattedTime = `${this.toTime < 10 ? '0' : ''}${this.toTime}:00:00`;
    const timestamp = `${this.toDate.split('T')[0]}T${formattedTime}`;
    return new Date(timestamp).toISOString();
  }
  get fromInFuture() {
    return isFuture(this.from);
  }
  get toInFuture() {
    return isFuture(this.to);
  }
  get invalidFromTime() {
    return this.fromTime < 0 || this.fromTime > 24;
  }
  get invalidToTime() {
    return this.toTime < 0 || this.toTime > 24;
  }
  get isNotModified() {
    return this.backup.from === this.from && this.backup.to === this.to;
  }
  get invalidRange() {
    return isBefore(this.to, this.from);
  }
  get invalidForm() {
    return this.fromInFuture || this.toInFuture || this.invalidFromTime || this.invalidToTime || this.invalidRange;
  }
}
