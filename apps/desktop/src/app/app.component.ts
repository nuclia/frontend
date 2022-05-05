import { Component, OnInit } from '@angular/core';
import { BackendConfigurationService, UserService } from '@flaps/auth';
import { STFUtils } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'dtp-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  version = '';
  constructor(
    private config: BackendConfigurationService,
    private translate: TranslateService,
    private user: UserService,
  ) {
    this.initTranslate(undefined);
    this.user.userPrefs.subscribe((prefs) => {
      this.initTranslate(prefs?.language?.toLowerCase());
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
}
