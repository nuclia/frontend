import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { injectScript, SDKService } from '@flaps/core';
import { IErrorMessages, PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { UserContainerComponent } from '../../user-container';
import { TranslateModule } from '@ngx-translate/core';

// TEMPORARY
// TODO: remove when the sign up form is on progress.com
@Component({
  selector: 'app-signup',
  templateUrl: './app-signup.component.html',
  styleUrls: ['./app-signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, UserContainerComponent, TranslateModule],
})
export class TemporaryAppSignupComponent implements OnInit {
  private sdk = inject(SDKService);

  unsubscribeAll = new Subject<void>();
  postUrl = `${this.sdk.nuclia.auth.getAuthUrl()}/signup/start`;
  // appUrl = this.sdk.getOriginFor('rag');
  appUrl = 'http://localhost:4200';
  demoUrl =
    'https://www.progress.com/agentic-rag/trial-guide?utm_medium=product&utm_source=trial-guide&utm_content=agentic-rag-trial';

  ngOnInit(): void {
    injectScript('https://cdn.cookielaw.org/consent/f9397248-1dbe-47fc-9dbf-c50e7dd51096-test/otSDKStub.js', [
      {
        key: 'data-domain-script',
        value: 'f9397248-1dbe-47fc-9dbf-c50e7dd51096-test',
      },
    ]).subscribe();
  }

  goToDemo() {
    window.open(this.demoUrl, 'blank', 'noreferrer');
  }
}
