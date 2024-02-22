import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { map, Observable, of, Subject } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { SisToastService } from '@nuclia/sistema';

interface StandaloneConfig {
  has_key: boolean;
  valid: boolean;
  error?: string;
}

interface Version {
  installed: string;
  latest: string;
}

export interface NucliaDBVersions {
  nucliadb: Version;
  'nucliadb-admin-assets': Version;
}

const VERSION_REGEXP = /(\d+\.\d+)\.\d+\.post\d+/;

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
        ? this.translate.instant('standalone.nua-key-status.invalid.title')
        : config.error || this.translate.instant('standalone.nua-key-status.invalid.not-provided');
    }),
  );

  private _versions = new Subject<NucliaDBVersions>();
  version: Observable<NucliaDBVersions> = this._versions.asObservable();

  constructor(
    private sdk: SDKService,
    private translate: TranslateService,
    private toast: SisToastService,
  ) {}

  checkStandaloneConfig(): Observable<StandaloneConfig> {
    return this.sdk.nuclia.rest.get<{ nua_api_key: StandaloneConfig }>('/config-check').pipe(
      map((result) => result.nua_api_key),
      catchError(() =>
        of({ has_key: false, valid: false, error: this.translate.instant('standalone.nua-key-status.loading-error') }),
      ),
    );
  }

  checkVersions() {
    this.sdk.nuclia.rest.get<NucliaDBVersions>('/versions').subscribe((version) => {
      const installedNucliaDB = version.nucliadb.installed.match(VERSION_REGEXP)?.[1] || '';
      const latestNucliaDB = version.nucliadb.latest.match(VERSION_REGEXP)?.[1] || '';
      const installedNucliaDBAdmin = version['nucliadb-admin-assets'].installed.match(VERSION_REGEXP)?.[1] || '';
      const latestNucliaDBAdmin = version['nucliadb-admin-assets'].latest.match(VERSION_REGEXP)?.[1] || '';

      if (installedNucliaDB < latestNucliaDB || installedNucliaDBAdmin < latestNucliaDBAdmin) {
        this.toast.warning('standalone.new-version-available-toast');
      }
      this._versions.next(version);
    });
  }
}
