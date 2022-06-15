import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { BackendConfigurationService } from '@flaps/auth';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  private menuOpenSubject = new Subject<boolean>();
  readonly menuOpen = this.menuOpenSubject.asObservable();

  private currentLocaleSubject = new BehaviorSubject<string>(
    this.getLocaleFromLang(this.translateService.currentLang)
  );
  readonly currentLocale = this.currentLocaleSubject.asObservable();

  private _searchEnabled = new BehaviorSubject<boolean>(true);
  readonly searchEnabled = this._searchEnabled.asObservable();

  constructor(
    private config: BackendConfigurationService,
    private translateService: TranslateService
  ) {
    this.listenLanguageChange();
  }

  setMenuOpen(value: boolean): void {
    this.menuOpenSubject.next(value);
  }

  getCurrentLocale(): string {
    return this.currentLocaleSubject.getValue();
  }

  setSearchEnabled(value: boolean): void {
    this._searchEnabled.next(value);
  }

  private listenLanguageChange(): void {
    this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      this.currentLocaleSubject.next(this.getLocaleFromLang(event.lang))
    });
  }

  private getLocaleFromLang(lang: string) {
    return this.config.getLocales().includes(lang) ? lang : 'en-US';
  }

}
