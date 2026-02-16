import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BackendConfigurationService, SDKService, STFUtils } from '@flaps/core';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const userLocaleKey = 'NUCLIA_USER_LOCALE';

@Component({
  selector: 'nma-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('toastsContainer', { read: ViewContainerRef, static: true }) toastsContainer?: ViewContainerRef;
  version?: string;

  private unsubscribeAll: Subject<void> = new Subject<void>();

  constructor(
    private paTranslate: PaTranslateService,
    private ngxTranslate: TranslateService,
    private config: BackendConfigurationService,
    private sdk: SDKService,
  ) {
    const userLocale = localStorage.getItem(userLocaleKey);
    this.initTranslate(userLocale);
    if (this.config.useRemoteLogin()) {
      this.remoteLogin();
    }
  }

  ngOnInit(): void {
    if (this.config.getVersion()) {
      this.version = this.config.getVersion();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private initTranslate(userLocale?: string | null) {
    this.ngxTranslate.setDefaultLang('en');
    const browserLang = this.ngxTranslate.getBrowserLang();

    if (userLocale && userLocale !== '') {
      this.ngxTranslate.use(userLocale);
    } else if (browserLang && STFUtils.supportedLanguages().indexOf(browserLang) > -1) {
      this.ngxTranslate.use(browserLang);
    } else {
      this.ngxTranslate.use('en');
    }

    this.ngxTranslate.onLangChange.pipe(takeUntil(this.unsubscribeAll)).subscribe((event) => {
      localStorage.setItem(userLocaleKey, event.lang);
      this.paTranslate.initTranslationsAndUse(event.lang, event.translations);
    });
  }

  private remoteLogin() {
    const params = location.search;
    if (params.includes('access_token')) {
      const querystring = new URLSearchParams(params.split('?')[1]);
      const access_token = querystring.get('access_token');
      if (access_token) {
        this.sdk.nuclia.auth.authenticate({
          access_token,
          refresh_token: querystring.get('refresh_token') || '',
        });
      }
    }
  }
}
