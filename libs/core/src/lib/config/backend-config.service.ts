import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

import { isPlatformBrowser, PlatformLocation } from '@angular/common';
import { AppInitService, EnvironmentConfiguration, StaticEnvironmentConfiguration } from './app.init.service';

@Injectable({ providedIn: 'root' })
export class BackendConfigurationService {
  private config: EnvironmentConfiguration;
  staticConf: StaticEnvironmentConfiguration;
  isBrowser = false;

  constructor(
    @Inject('staticEnvironmentConfiguration') private environmentConfiguration: StaticEnvironmentConfiguration,
    private apiConfig: AppInitService,
    public platformLocation: PlatformLocation,
    @Inject(PLATFORM_ID) platformId: any,
  ) {
    this.config = this.apiConfig.getConfig();
    this.staticConf = this.environmentConfiguration;
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getAPIURL(): string {
    return this.config.backend.api;
  }

  getAPIOrigin(): string {
    return this.config.backend.apiOrigin || '';
  }

  getOAuthServer(): string {
    return this.config.backend.oauth || this.getAPIOrigin();
  }

  getAppName(): string {
    return this.config.backend.app;
  }

  getRecaptchaKey(): string | undefined {
    return this.config.backend.siteKey;
  }

  getSocialLogin(): boolean {
    return this.staticConf.backend.social_login;
  }

  getAllowedHostsRedirect(): string[] {
    return this.config.backend.allowed_hosts_redirect || [];
  }

  getNewApi(): boolean {
    return !!this.staticConf.backend.new_api;
  }

  getLocales(): string[] {
    return this.staticConf.locales || [];
  }

  getVersion(): string {
    return this.config.version;
  }

  getCDN(): string {
    return this.config.backend.cdn;
  }

  getAssetsPath(): string {
    return this.config.backend.assetsPath || 'assets';
  }

  getBrandName(): string {
    return this.config.backend.brand_name || 'Nuclia';
  }

  useRemoteLogin(): boolean {
    return this.config.remoteLogin || false;
  }
}
