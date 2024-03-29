import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const NEXT_URL_KEY = 'NEXT_URL_KEY';
const NEXT_URL_PARAMS_KEY = 'NEXT_URL_PARAMS';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isBrowser = true;

  timerRefreshTokenSubscription: any;

  constructor(@Inject(PLATFORM_ID) platformId: any) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getNextUrl(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(NEXT_URL_KEY);
    } else {
      return null;
    }
  }

  setNextUrl(url: string | null): void {
    if (this.isBrowser) {
      if (url) {
        localStorage.setItem(NEXT_URL_KEY, url);
      } else {
        localStorage.removeItem(NEXT_URL_KEY);
      }
    }
  }

  getNextParams(): string | null {
    return localStorage.getItem(NEXT_URL_PARAMS_KEY);
  }

  setNextParams(data: any | null) {
    if (data) {
      localStorage.setItem(NEXT_URL_PARAMS_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(NEXT_URL_PARAMS_KEY);
    }
  }
}
