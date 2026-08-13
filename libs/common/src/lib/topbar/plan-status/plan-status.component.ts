import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PaChipsModule } from '@guillotinaweb/pastanaga-angular';
import { BillingService, FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { AccountTypes } from '@nuclia/core';
import { combineLatest, map, of, shareReplay, switchMap, take } from 'rxjs';
import { differenceInDays } from 'date-fns';

// Plans for which upgrading isn't an option
const NO_UPGRADE_ACCOUNT_TYPES: AccountTypes[] = ['v3enterprise', 'v3pro', 'v3growth'];

interface PlanStatusVm {
  isTrial: boolean;
  labelKey: string;
  daysLeft: number | null;
  used: number | null;
  limit: number | null;
}

@Component({
  selector: 'stf-plan-status',
  standalone: true,
  imports: [CommonModule, TranslateModule, PaChipsModule],
  templateUrl: './plan-status.component.html',
  styleUrl: './plan-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanStatusComponent {
  private sdk = inject(SDKService);
  private features = inject(FeaturesService);
  private billing = inject(BillingService);
  private navigation = inject(NavigationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private accountType$ = this.sdk.currentAccount.pipe(map((account) => account.type));
  private isTypeEnforced$ = combineLatest([
    this.accountType$,
    this.route.queryParams.pipe(map((params) => params['type'])),
  ]).pipe(map(([currentType, nextType]) => !!nextType && currentType !== nextType));

  showUpgrade$ = combineLatest([this.accountType$, this.isTypeEnforced$, this.features.isAccountManager]).pipe(
    map(
      ([accountType, isTypeEnforced, isAccountManager]) =>
        !!accountType && !NO_UPGRADE_ACCOUNT_TYPES.includes(accountType) && !isTypeEnforced && isAccountManager,
    ),
  );

  vm$ = combineLatest([this.features.isTrial, this.sdk.currentAccount]).pipe(
    switchMap(([isTrial, account]) => {
      if (this.navigation.inPlatformApp) {
        return of(null);
      }
      if (!isTrial) {
        return of({
          isTrial: false,
          labelKey: `account.type.${account.type}`,
          daysLeft: null,
          used: null,
          limit: null,
        });
      }
      const daysLeft = account.trial_expiration_date
        ? Math.max(differenceInDays(new Date(`${account.trial_expiration_date}+00:00`), new Date()) + 1, 0)
        : null;
      return this.billing.getTrialTokenUsage().pipe(
        map(
          (usage): PlanStatusVm => ({
            isTrial: true,
            labelKey: 'account.type.stash-trial',
            daysLeft,
            used: usage?.used ?? null,
            limit: usage?.limit ?? null,
          }),
        ),
      );
    }),
    shareReplay(1),
  );

  goToSubscriptions() {
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      this.router.navigate([this.navigation.getBillingUrl(account.slug)]);
    });
  }
}
