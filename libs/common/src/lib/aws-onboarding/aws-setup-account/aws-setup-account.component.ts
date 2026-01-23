import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { AwsOnboardingPayload, Step1Component } from '@nuclia/user';
import { SisProgressModule, SisToastService } from '@nuclia/sistema';
import { ActivatedRoute } from '@angular/router';
import { switchMap, take, tap } from 'rxjs';
import { SDKService, STFUtils } from '@flaps/core';
import { Account, AuthTokens } from '@nuclia/core';

interface SetupAccountPayload {
  customer_token: string;
  account_slug?: string;
  customer_data?: AwsOnboardingPayload;
}

@Component({
  selector: 'app-aws-setup-account',
  imports: [CommonModule, TranslateModule, PaTextFieldModule, PaButtonModule, SisProgressModule, Step1Component],
  templateUrl: './aws-setup-account.component.html',
  styleUrl: './aws-setup-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwsSetupAccountComponent {
  sdk = inject(SDKService);
  toaster = inject(SisToastService);
  translate = inject(TranslateService);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  creatingAccount = false;

  // pa-select should be rendered once translations are ready, otherwise the selected value is hidden
  translationsReady = this.translate.get('any');

  @Output() next = new EventEmitter<Account>();

  submit(data: AwsOnboardingPayload, firstAttempt = true) {
    this.creatingAccount = true;
    this.cdr.markForCheck();
    let accountSlug = STFUtils.generateSlug(data.company);
    if (!firstAttempt) {
      accountSlug = `${accountSlug}-${STFUtils.generateRandomSlugSuffix()}`;
    }
    this.route.queryParams
      .pipe(
        take(1),
        switchMap((queryParams) => {
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
          if (firstAttempt && error?.body?.error_code === 'AWS_MP_ACCOUNT_SLUG_ALREADY_EXISTS') {
            this.submit(data, false);
          } else {
            this.creatingAccount = false;
            this.cdr.markForCheck();
            this.toaster.error(error?.status === 409 ? 'onboarding.aws.email-error' : 'login.error.oops');
          }
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
