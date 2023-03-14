import { Component } from '@angular/core';
import { STFUtils } from '@flaps/core';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nco-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'contributor';

  private unsubscribeAll: Subject<void> = new Subject<void>();

  constructor(private ngxTranslate: TranslateService, private paTranslate: PaTranslateService) {
    this.initTranslate(undefined);
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

    this.ngxTranslate.onLangChange
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((event) => this.paTranslate.initTranslationsAndUse(event.lang, event.translations));
  }
}
