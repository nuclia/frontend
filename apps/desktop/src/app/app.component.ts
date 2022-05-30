import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/auth';
import { STFUtils } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { SOURCE_ID_KEY } from './sync/models';

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
    private router: Router,
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
        const deeplink = (window as any)['deeplink'] || location.search;
        if (!this.sdk.nuclia.auth.getToken()) {
          if (deeplink && deeplink.includes('?')) {
            const querystring = new URLSearchParams(deeplink.split('?')[1]);
            this.sdk.nuclia.auth.authenticate({
              access_token: querystring.get('access_token') || '',
              refresh_token: querystring.get('refresh_token') || '',
            });
            if (!(window as any)['deeplink']) {
              location.search = '';
            }
            clearInterval(interval);
          }
        } else {
          clearInterval(interval);
        }
      }, 500);
      if ((window as any)['electron']) {
        (window as any)['electron'].openExternal(`${environment.dashboard}/redirect?redirect=nuclia-desktop://`);
      } else if (!location.search) {
        // dev mode in browser
        location.href = `${environment.dashboard}/redirect?redirect=http://localhost:4200`;
      }
    } else if (localStorage.getItem(SOURCE_ID_KEY)) {
      const interval = setInterval(() => {
        const deeplink = (window as any)['deeplink'] || location.search;
        if (deeplink && deeplink.includes('?')) {
          this.router.navigateByUrl(`/add-upload${deeplink}`);
          clearInterval(interval);
        }
      }, 500);
    }
  }
}
