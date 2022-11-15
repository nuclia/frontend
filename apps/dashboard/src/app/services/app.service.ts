import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, Subject } from 'rxjs';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { BackendConfigurationService, SDKService } from '@flaps/core';

const EMPTY_KB_ALERT = 'NUCLIA_EMPTY_KB_ALERT';

@Injectable({
  providedIn: 'root',
})
export class AppService {
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

  isKbStillEmptyAfterFirstDay(): Observable<boolean> {
    return combineLatest([this.sdk.currentKb, this.sdk.counters]).pipe(
      map(([currentKb, counters]) => {
        let isStillEmptyAfterFirstDay = false;
        let emptyKbs = JSON.parse(localStorage.getItem(EMPTY_KB_ALERT) || '{}');
        // if we have a number in the localstorage, it means it's a timestamp like the previous format,
        // so we reset it as we don't know for which kb it was set
        if (typeof emptyKbs === 'number') {
          emptyKbs = {};
        }

        if (counters.resources > 0) {
          delete emptyKbs[currentKb.id];
        } else if (!emptyKbs[currentKb.id]) {
          // Skip the first day
          emptyKbs[currentKb.id] = Date.now().toString();
        } else {
          const timestamp = emptyKbs[currentKb.id];
          const prevDate = new Date(parseInt(timestamp, 10));
          isStillEmptyAfterFirstDay = prevDate.getDay() !== new Date().getDay();
        }
        localStorage.setItem(EMPTY_KB_ALERT, JSON.stringify(emptyKbs));

        return isStillEmptyAfterFirstDay;
      }),
    );
  }
}
