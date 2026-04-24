import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { injectScript, SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { UserContainerComponent } from '../../user-container';

@Component({
  selector: 'app-signup',
  templateUrl: './app-signup.component.html',
  styleUrls: ['./app-signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, UserContainerComponent],
})
export class TestingAppSignupComponent implements OnInit {
  private sdk = inject(SDKService);

  unsubscribeAll = new Subject<void>();
  postUrl = `${this.sdk.nuclia.auth.getAuthUrl()}/signup/start`;
  appUrl = this.sdk.getOriginForApp(location.search.includes('app=rao') ? 'rao' : 'rag');

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
