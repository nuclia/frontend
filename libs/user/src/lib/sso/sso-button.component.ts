import { booleanAttribute, ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { AnalyticsService, SsoService } from '@flaps/core';
import { WINDOW } from '@ng-web-apis/common';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaIconModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

type Provider = 'google' | 'github' | 'microsoft';

@Component({
  selector: 'stf-sso-button',
  templateUrl: './sso-button.component.html',
  styleUrls: ['./sso-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaIconModule, PaTooltipModule, TranslateModule],
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

  @Input({ transform: booleanAttribute }) compact = false;

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

  get labelKey() {
    return this.signup ? 'signup.sign-up-with' : 'login.continue_with';
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
    private analytics: AnalyticsService,
  ) {}

  onClick() {
    if (this._signup) {
      this.analytics.logTrialSignup();
    }
    this.window.location.href = this.ssoService.getSsoLoginUrl(this.provider);
  }
}
