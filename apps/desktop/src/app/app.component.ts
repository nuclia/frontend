import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/core';
import { STFUtils, STFTrackingService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { CONNECTOR_ID_KEY } from './sync/models';
import { getDeeplink } from './utils';

@Component({
  selector: 'nde-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  isAuthenticated = true;
  version = '';
  constructor(
    private config: BackendConfigurationService,
    private translate: TranslateService,
    private user: UserService,
    private sdk: SDKService,
    private router: Router,
    private tracking: STFTrackingService,
    private cdr: ChangeDetectorRef,
  ) {
    this.initTranslate(undefined);
    this.user.userPrefs.subscribe((prefs) => {
      this.initTranslate(prefs?.language?.toLowerCase());
    });
    this.authenticate();
    this.sdk.nuclia.auth.hasLoggedOut().subscribe(() => {
      this.tracking.logout();
    });
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
    this.sdk.nuclia.auth.isAuthenticated().subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        const interval = setInterval(() => {
          const deeplink = getDeeplink();
          if (!this.sdk.nuclia.auth.getToken()) {
            if (deeplink && deeplink.includes('?')) {
              const querystring = new URLSearchParams(deeplink.split('?')[1]);
              this.sdk.nuclia.auth.authenticate({
                access_token: querystring.get('access_token') || '',
                refresh_token: querystring.get('refresh_token') || '',
              });
              this.isAuthenticated = true;
              this.cdr?.markForCheck();
              if (!(window as any)['deeplink']) {
                location.search = '';
              }
              clearInterval(interval);
            }
          } else {
            clearInterval(interval);
          }
        }, 500);
        // delay a bit the login button display to avoid ugly flash
        setTimeout(() => {
          this.isAuthenticated = false;
          this.cdr?.markForCheck();
        }, 500);
      } else if (localStorage.getItem(CONNECTOR_ID_KEY)) {
        const interval = setInterval(() => {
          const deeplink = getDeeplink();
          if (deeplink && deeplink.includes('?')) {
            if ((window as any)['electron']) {
              this.router.navigate(['/add-upload']);
            } else {
              this.router.navigateByUrl(`/add-upload${deeplink}`);
            }
            clearInterval(interval);
          }
        }, 500);
      }
    });
  }

  debug() {
    if ((window as any)['electron']) {
      (window as any)['electron'].debug();
    }
  }
}
