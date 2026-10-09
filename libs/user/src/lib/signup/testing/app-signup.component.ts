import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { injectScript, SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserContainerComponent } from '../../user-container';
import { TestingSignupService } from './testing-signup.service';

@Component({
  selector: 'app-signup',
  templateUrl: './app-signup.component.html',
  styleUrl: './app-signup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, TranslateModule, UserContainerComponent],
  providers: [TestingSignupService],
})
export class TestingAppSignupComponent implements OnInit {
  private sdk = inject(SDKService);
  private destroyRef = inject(DestroyRef);
  private signupService = inject(TestingSignupService);

  private appUrl = this.sdk.getOriginForApp(location.search.includes('app=rao') ? 'rao' : 'rag');

  protected signupKey = signal('');
  protected email = signal('');
  protected fullName = signal('');
  protected company = signal('');
  protected workflow = signal('cowork');
  protected isSubmitting = signal(false);
  protected signupError = signal('');

  ngOnInit(): void {
    injectScript('https://cdn.cookielaw.org/consent/f9397248-1dbe-47fc-9dbf-c50e7dd51096-test/otSDKStub.js', [
      {
        key: 'data-domain-script',
        value: 'f9397248-1dbe-47fc-9dbf-c50e7dd51096-test',
      },
    ]).subscribe();
  }

  protected login(event: Event) {
    event.preventDefault();
    this.sdk.nuclia.auth.redirectToOAuth();
  }

  protected submitSignup(event: Event): void {
    event.preventDefault();
    if (this.isSubmitting()) return;

    const signupKey = this.signupKey().trim();
    const email = this.email().trim();
    if (!signupKey || !email) {
      this.signupError.set('signup.testing.error.required');
      return;
    }

    this.signupError.set('');
    this.signupKey.set('');
    this.isSubmitting.set(true);

    this.signupService
      .startSignup(signupKey, {
        email,
        fullname: this.fullName().trim() || undefined,
        company: this.company().trim() || undefined,
        workflow: this.workflow().trim() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          if (!response?.signup_token) {
            this.signupError.set('signup.testing.error.generic');
            return;
          }

          const targetUrl = new URL(this.appUrl);
          targetUrl.searchParams.set('signup_token', response.signup_token);
          window.location.assign(targetUrl.toString());
        },
        error: (error: { status?: number }) => {
          this.isSubmitting.set(false);
          this.signupError.set(
            error?.status === 401
              ? 'signup.testing.error.invalid_key'
              : error?.status === 422
                ? 'signup.testing.error.invalid_details'
                : 'signup.testing.error.generic',
          );
        },
      });
  }
}
