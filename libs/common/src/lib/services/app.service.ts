import { Injectable } from '@angular/core';
import { BackendConfigurationService } from '@flaps/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private currentLocaleSubject = new BehaviorSubject<string>(
    this.getLocaleFromLang(this.translateService.getCurrentLang()),
  );
  readonly currentLocale = this.currentLocaleSubject.asObservable();

  constructor(
    private config: BackendConfigurationService,
    private translateService: TranslateService,
  ) {
    this.listenLanguageChange();
  }

  getCurrentLocale(): string {
    return this.currentLocaleSubject.getValue();
  }

  private listenLanguageChange(): void {
    this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      this.currentLocaleSubject.next(this.getLocaleFromLang(event.lang));
    });
  }

  private getLocaleFromLang(lang: string) {
    return this.config.getLocales().includes(lang) ? lang : 'en-US';
  }
}
