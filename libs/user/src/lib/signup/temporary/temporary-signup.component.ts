import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { UserContainerComponent } from '../../user-container';

@Component({
  selector: 'app-temporary-signup',
  templateUrl: './temporary-signup.component.html',
  styleUrl: './temporary-signup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, PaTogglesModule, TranslatePipe, UserContainerComponent],
})
export class TemporaryContextBoxSignupComponent {
  private sdk = inject(SDKService);

  unsubscribeAll = new Subject<void>();
  postUrl = `${this.sdk.nuclia.auth.getAuthUrl()}/signup/start`;
  appUrl = this.sdk.getOriginForApp('rag');
  agree = false;

  login() {
    this.sdk.nuclia.auth.redirectToOAuth();
  }
}
