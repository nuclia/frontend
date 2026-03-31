import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { AccountVerificationService, NavigationService, SDKService, UserService } from '@flaps/core';
import { map, shareReplay, switchMap, take } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-account-delete',
  templateUrl: './account-delete.component.html',
  styleUrls: ['./account-delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountDeleteComponent implements OnInit {
  loading = signal(false);
  deleteAccount = signal(false);
  keepUser = signal<'yes' | 'no' | undefined>(undefined);
  account = this.sdk.currentAccount;
  canKeepUser = this.sdk.nuclia.db.getWelcome().pipe(
    map((welcome) => welcome.accounts.length > 1),
    shareReplay(1),
  );
  userEmail$ = this.user.userPrefs.pipe(map((prefs) => prefs?.email ?? ''));

  step = signal<'otp' | 'confirm'>('confirm');
  otpCode = signal<string | undefined>(undefined);
  otpSent = signal(false);
  otpSending = signal(false);
  otpError = signal(false);

  constructor(
    public modal: ModalRef,
    private sdk: SDKService,
    private toaster: SisToastService,
    private router: Router,
    private navigation: NavigationService,
    private user: UserService,
    private accountVerification: AccountVerificationService,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    if (this.accountVerification.supportsForceReauth()) {
      if (this.accountVerification.isRecentlyVerified()) {
        this.step.set('confirm');
      } else {
        this.modal.close();
        this.accountVerification.forceReauth(window.location.href);
      }
    } else {
      this.step.set('otp');
    }
  }

  requestOtp(): void {
    this.otpSending.set(true);
    this.otpError.set(false);
    this.accountVerification
      .requestEmailOtp()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.otpSent.set(true);
          this.otpSending.set(false);
        },
        error: () => {
          this.otpError.set(true);
          this.otpSending.set(false);
        },
      });
  }

  onOtpComplete(code: string): void {
    this.otpCode.set(code);
  }

  onOtpChange(value: string): void {
    if (value.length < 6) {
      this.otpCode.set(undefined);
    }
  }

  advanceToConfirm(): void {
    this.step.set('confirm');
  }

  delete(): void {
    this.loading.set(true);
    const keepUser = this.keepUser() === 'yes';
    const otpCode = this.otpCode();
    this.account
      .pipe(
        take(1),
        switchMap((account) => this.sdk.nuclia.db.deleteAccount(account.slug, otpCode)),
        switchMap(() => (keepUser ? this.user.updateWelcome() : this.sdk.nuclia.auth.deleteAuthenticatedUser())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.sdk.cleanAccount();
          if (keepUser) {
            this.router.navigate([this.navigation.getAccountSelectUrl()]);
          } else {
            this.router.navigate(['/farewell']);
          }
          this.modal.close();
        },
        error: () => {
          this.toaster.error('account.delete.error');
          this.loading.set(false);
        },
      });
  }
}
