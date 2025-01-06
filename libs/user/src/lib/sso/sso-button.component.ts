import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { SsoService } from '@flaps/core';
import { WINDOW } from '@ng-web-apis/common';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { TranslateService } from '@ngx-translate/core';

type Provider = 'google' | 'github';

@Component({
  selector: 'stf-sso-button',
  templateUrl: './sso-button.component.html',
  styleUrls: ['./sso-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SsoButtonComponent {
  @Input()
  set provider(value: Provider) {
    this._provider = value;
  }
  get provider() {
    return this._provider;
  }

  @Input()
  set signup(value: any) {
    this._signup = coerceBooleanProperty(value);
  }
  get signup() {
    return this._signup;
  }

  get capitalizedProvider() {
    return this.provider.slice(0, 1).toUpperCase() + this.provider.slice(1);
  }

  get providerName() {
    if (this.provider === 'google' && this.signup) {
      return this.translate.instant('login.google-workspace');
    } else {
      return this.capitalizedProvider;
    }
  }

  get icon() {
    return `assets/sso-icons/${this.provider}.svg`;
  }

  private _provider: Provider = 'google';
  private _signup = false;

  constructor(
    private ssoService: SsoService,
    @Inject(WINDOW) private window: Window,
    private translate: TranslateService,
  ) {}

  onClick() {
    this.window.location.href = this.ssoService.getSsoLoginUrl(this.provider);
  }
}
