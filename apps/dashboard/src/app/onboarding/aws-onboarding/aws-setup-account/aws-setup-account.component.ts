import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { AwsOnboardingPayload, OnboardingService, Step1Component } from '@nuclia/user';
import { SisProgressModule, SisToastService } from '@nuclia/sistema';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, switchMap, take, tap } from 'rxjs';
import { SDKService, STFUtils } from '@flaps/core';
import { Account, AuthTokens } from '@nuclia/core';

interface SetupAccountPayload {
  customer_token: string;
  account_slug?: string;
  customer_data?: AwsOnboardingPayload;
}

@Component({
  selector: 'app-aws-setup-account',
  imports: [TranslateModule, PaTextFieldModule, PaButtonModule, SisProgressModule, Step1Component],
  templateUrl: './aws-setup-account.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwsSetupAccountComponent {
  sdk = inject(SDKService);
  onboardingService = inject(OnboardingService);
  toaster = inject(SisToastService);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  creatingAccount = false;

  @Output() next = new EventEmitter<Account>();

  submit(data: AwsOnboardingPayload) {
    this.creatingAccount = true;
    this.cdr.markForCheck();
    forkJoin([
      this.route.queryParams.pipe(take(1)),
      this.onboardingService.getAvailableAccountSlug(STFUtils.generateSlug(data.company)),
    ])
      .pipe(
        take(1),
        switchMap(([queryParams, accountSlug]) => {
          const payload = {
            customer_token: queryParams['customer_token'],
            account_slug: accountSlug,
            customer_data: data,
          };
          return this.setupAccount(payload);
        }),
      )
      .subscribe({
        next: (account) => {
          this.next.emit(account);
        },
        error: (error) => {
          this.creatingAccount = false;
          this.cdr.markForCheck();
          this.toaster.error(error?.body?.detail || 'login.error.oops');
        },
      });
  }

  setupAccount(payload: SetupAccountPayload) {
    return this.sdk.nuclia.rest
      .post<AuthTokens & { account_id: string }>(`/marketplace/aws/setup_account`, payload)
      .pipe(
        tap((result) => this.sdk.nuclia.auth.authenticate(result)),
        switchMap((result) => this.sdk.setCurrentAccount(result.account_id)),
      );
  }
}
