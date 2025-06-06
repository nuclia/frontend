import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BackendConfigurationService, STFUtils } from '@flaps/core';
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
    private config: BackendConfigurationService,
    private ngxTranslate: TranslateService,
  ) {
    const userLocale = localStorage.getItem(userLocaleKey);
    this.initTranslate(userLocale);
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
}
