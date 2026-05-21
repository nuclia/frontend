import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { injectScript, SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserContainerComponent } from '../../user-container';

@Component({
  selector: 'app-temporary-signup',
  templateUrl: './temporary-signup.component.html',
  styleUrl: './temporary-signup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, PaTogglesModule, TranslateModule, UserContainerComponent],
})
export class TemporaryContextBoxSignupComponent implements OnInit {
  private sdk = inject(SDKService);

  unsubscribeAll = new Subject<void>();
  postUrl = `${this.sdk.nuclia.auth.getAuthUrl()}/signup/start`;
  appUrl = this.sdk.getOriginForApp('rag');
  agree = false;

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
}
