import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { map, Observable, of } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

interface StandaloneConfig {
  has_key: boolean;
  valid: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StandaloneService {
  standalone = this.sdk.nuclia.options.standalone;
  private _configCheck: Observable<StandaloneConfig | null> = this.standalone ? this.checkStandaloneConfig() : of(null);

  hasValidKey: Observable<boolean> = this._configCheck.pipe(
    map((config) => !!config && config.has_key && config.valid),
  );
  errorMessage: Observable<string> = this._configCheck.pipe(
    filter((config) => !!config && (!config.has_key || !config.valid)),
    map((conf) => {
      const config = conf as StandaloneConfig;
      return config.has_key && !config.valid
        ? this.translate.instant('standalone.nua-key-status.invalid')
        : config.error || this.translate.instant('standalone.nua-key-status.not-provided');
    }),
  );

  constructor(private sdk: SDKService, private translate: TranslateService) {}

  checkStandaloneConfig(): Observable<StandaloneConfig> {
    return this.sdk.nuclia.rest.get<{ nua_api_key: StandaloneConfig }>('/config-check').pipe(
      map((result) => result.nua_api_key),
      catchError(() =>
        of({ has_key: false, valid: false, error: this.translate.instant('standalone.nua-key-status.loading-error') }),
      ),
    );
  }
}
