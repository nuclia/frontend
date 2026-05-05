import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { injectScript, SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserContainerComponent } from '../../user-container';

@Component({
  selector: 'app-signup',
  templateUrl: './app-signup.component.html',
  styleUrl: './app-signup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, TranslateModule, UserContainerComponent],
})
export class TestingAppSignupComponent implements OnInit {
  private sdk = inject(SDKService);

  unsubscribeAll = new Subject<void>();
  postUrl = `${this.sdk.nuclia.auth.getAuthUrl()}/signup/start`;
  appUrl = this.sdk.getOriginForApp(location.search.includes('app=rao') ? 'rao' : 'rag');

  unlocked = signal(false);
  passwordInput = signal('');
  wrongPassword = signal(false);

  ngOnInit(): void {
    injectScript('https://cdn.cookielaw.org/consent/f9397248-1dbe-47fc-9dbf-c50e7dd51096-test/otSDKStub.js', [
      {
        key: 'data-domain-script',
        value: 'f9397248-1dbe-47fc-9dbf-c50e7dd51096-test',
      },
    ]).subscribe();
  }

  login() {
    this.sdk.nuclia.auth.redirectToOAuth();
  }

  unlock() {
    if (this.passwordInput() === 'testingtesting') {
      this.unlocked.set(true);
      this.wrongPassword.set(false);
    } else {
      this.wrongPassword.set(true);
    }
  }
}
