import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { UploadService } from '../upload/upload.service';

const EMPTY_KB_ALERT = 'NUCLIA_EMPTY_KB_ALERT';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private currentLocaleSubject = new BehaviorSubject<string>(this.getLocaleFromLang(this.translateService.currentLang));
  readonly currentLocale = this.currentLocaleSubject.asObservable();

  constructor(
    private config: BackendConfigurationService,
    private translateService: TranslateService,
    private sdk: SDKService,
    private uploadService: UploadService,
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
