import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BackendConfigurationService, SDKService, STFTrackingService, STFUtils, UserService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { CONNECTOR_ID_KEY } from './sync/models';
import { getDeeplink } from './utils';
import pkg from '../../../../package.json';
import { filter, map, switchMap, take } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';

@Component({
  selector: 'nde-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  version = '';
  isAuthenticated = true;
  hasTrialExpired = this.sdk.nuclia.auth.isAuthenticated().pipe(
    filter((isAuthenticated) => isAuthenticated),
    switchMap(() => this.sdk.currentAccount),
    filter((account) => account.type === 'stash-trial'),
    map((account) => {
      const expiration = new Date(`${account.trial_expiration_date}+00:00`);
      const now = new Date();
      return expiration < now;
    }),
    filter((hasExpired) => hasExpired),
  );
  constructor(
    private config: BackendConfigurationService,
    private paTranslate: PaTranslateService,
    private ngxTranslate: TranslateService,
    private user: UserService,
    private sdk: SDKService,
    private router: Router,
    private tracking: STFTrackingService,
    private modalService: SisModalService,
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
      this.version = `${pkg['version']} - ${this.config.getVersion()}`;
    }
    this.checkTrialExpiration();
  }

  initTranslate(userLocale?: string) {
    this.ngxTranslate.setDefaultLang('en');
    const browserLang = this.ngxTranslate.getBrowserLang();

    if (userLocale && userLocale !== '') {
      this.ngxTranslate.use(userLocale);
    } else if (browserLang && STFUtils.supportedLanguages().indexOf(browserLang) > -1) {
      this.ngxTranslate.use(browserLang);
    } else {
      this.ngxTranslate.use('en');
    }

    this.ngxTranslate.onLangChange.subscribe((event) =>
      this.paTranslate.initTranslationsAndUse(event.lang, event.translations),
    );
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

  private checkTrialExpiration() {
    this.hasTrialExpired
      .pipe(
        take(1),
        switchMap(
          () =>
            this.modalService.openConfirm({
              title: 'account.trial-end.title',
              description: 'account.trial-end.help',
              onlyConfirm: true,
            }).onClose,
        ),
      )
      .subscribe(() => {
        if ((window as any)['electron']) {
          (window as any)['electron'].openExternal('https://nuclia.cloud');
        } else if (!location.search) {
          // dev mode in browser
          location.href = 'https://nuclia.cloud';
        }
      });
  }
}
