import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, take, map, tap } from 'rxjs';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { BackendConfigurationService, SDKService } from '@flaps/auth';

const EMPTY_KB_ALERT = 'NUCLIA_EMPTY_KB_ALERT';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private menuOpenSubject = new Subject<boolean>();
  readonly menuOpen = this.menuOpenSubject.asObservable();

  private currentLocaleSubject = new BehaviorSubject<string>(this.getLocaleFromLang(this.translateService.currentLang));
  readonly currentLocale = this.currentLocaleSubject.asObservable();

  private _searchEnabled = new BehaviorSubject<boolean>(true);
  readonly searchEnabled = this._searchEnabled.asObservable();

  constructor(
    private config: BackendConfigurationService,
    private translateService: TranslateService,
    private sdk: SDKService,
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
      this.currentLocaleSubject.next(this.getLocaleFromLang(event.lang));
    });
  }

  private getLocaleFromLang(lang: string) {
    return this.config.getLocales().includes(lang) ? lang : 'en-US';
  }

  isKbStillEmptyAfterFirstDay() {
    return this.sdk.counters.pipe(
      take(1),
      map((counters) => {
        if (counters.resources > 0) return false;
        const timestamp = localStorage.getItem(EMPTY_KB_ALERT);
        if (!timestamp) {
          return false; // Skip the first day
        } else {
          const prevDate = new Date(parseInt(timestamp, 10));
          return prevDate.getDay() !== new Date().getDay();
        }
      }),
      tap(() => {
        localStorage.setItem(EMPTY_KB_ALERT, Date.now().toString());
      }),
    );
  }
}
