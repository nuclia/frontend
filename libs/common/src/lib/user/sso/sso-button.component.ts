import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { SsoService } from '@flaps/core';
import { WINDOW } from '@ng-web-apis/common';

type Provider = 'google' | 'github';

@Component({
  selector: 'stf-sso-button',
  templateUrl: './sso-button.component.html',
  styleUrls: ['./sso-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SsoButtonComponent {
  @Input()
  set provider(value: Provider) {
    this._provider = value;
  }
  get provider() {
    return this._provider;
  }

  get capitalizedProvider() {
    return this.provider.slice(0, 1).toUpperCase() + this.provider.slice(1);
  }
  get icon() {
    return `assets/icons/${this.provider}.svg`;
  }

  private _provider: Provider = 'google';

  constructor(private ssoService: SsoService, @Inject(WINDOW) private window: Window) {}

  onClick() {
    this.window.location.href = this.ssoService.getSsoLoginUrl(this.provider);
  }
}
