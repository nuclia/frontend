import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackendConfigurationService, SDKService, STFUtils } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { HlmToasterImports } from '@nuclia/ui-spartan/sonner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const userLocaleKey = 'NUCLIA_USER_LOCALE';

@Component({
  selector: 'nma-main',
  templateUrl: './main.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterOutlet, HlmToasterImports],
})
export class MainComponent implements OnInit, OnDestroy {
  version?: string;

  private unsubscribeAll: Subject<void> = new Subject<void>();

  constructor(
    private config: BackendConfigurationService,
    private ngxTranslate: TranslateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
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
    this.ngxTranslate.setFallbackLang('en');
    const browserLang = this.ngxTranslate.getBrowserLang();

    if (userLocale && userLocale !== '') {
      this.ngxTranslate.use(userLocale);
    } else if (browserLang && STFUtils.supportedLanguages().includes(browserLang)) {
      this.ngxTranslate.use(browserLang);
    } else {
      this.ngxTranslate.use('en');
    }

    this.ngxTranslate.onLangChange.pipe(takeUntil(this.unsubscribeAll)).subscribe((event) => {
      localStorage.setItem(userLocaleKey, event.lang);
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
