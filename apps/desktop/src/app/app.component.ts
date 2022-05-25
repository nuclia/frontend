import { Component, OnInit } from '@angular/core';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/auth';
import { STFUtils } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'da-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  version = '';
  constructor(
    private config: BackendConfigurationService,
    private translate: TranslateService,
    private user: UserService,
    private sdk: SDKService,
  ) {
    this.initTranslate(undefined);
    this.user.userPrefs.subscribe((prefs) => {
      this.initTranslate(prefs?.language?.toLowerCase());
    });
    this.authenticate();
  }

  ngOnInit(): void {
    if (this.config.getVersion()) {
      this.version = this.config.getVersion();
    }
  }

  initTranslate(userLocale?: string) {
    this.translate.setDefaultLang('en');
    const browserLang = this.translate.getBrowserLang();

    if (userLocale && userLocale !== '') {
      this.translate.use(userLocale);
    } else if (browserLang && STFUtils.supportedLanguages().indexOf(browserLang) > -1) {
      this.translate.use(browserLang);
    } else {
      this.translate.use('en');
    }
  }

  authenticate() {
    if (!this.sdk.nuclia.auth.getToken()) {
      const interval = setInterval(() => {
        if (!this.sdk.nuclia.auth.getToken()) {
          const deeplink = (window as any)['deeplink'] || location.search;
          if (deeplink && deeplink.includes('?')) {
            const querystring = new URLSearchParams(deeplink.split('?')[1]);
            this.sdk.nuclia.auth.authenticate({
              access_token: querystring.get('access_token') || '',
              refresh_token: querystring.get('refresh_token') || '',
            });
            clearInterval(interval);
          }
        } else {
          clearInterval(interval);
        }
      }, 500);
      if ((window as any)['electron']) {
        (window as any)['electron'].openExternal('http://localhost:4200/redirect?redirect=nuclia-desktop://');
      } else if (!location.search) {
        // dev mode in browser
        location.href = 'https://stashify.cloud/redirect?redirect=http://localhost:4200';
      }
    }
  }
}
