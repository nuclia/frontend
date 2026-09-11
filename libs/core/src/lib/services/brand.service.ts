import { inject, Injectable } from '@angular/core';
import { map, of } from 'rxjs';
import { BackendConfigurationService, StaticEnvironmentConfiguration } from '../config';
import { AccountEntryContextService, OAuthService } from '../auth';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private backendConfig = inject(BackendConfigurationService);
  private oAuthService = inject(OAuthService);
  private entryContext = inject(AccountEntryContextService);
  private environment = inject<StaticEnvironmentConfiguration>('staticEnvironmentConfiguration' as any);

  isPDP =
    this.environment.client === 'auth'
      ? this.oAuthService.cameFrom.pipe(map((cameFrom) => cameFrom?.includes('https://platform')))
      : this.environment.client === 'admin'
        ? of(this.entryContext.get()?.originClient === 'platform')
        : of(false);

  logoPath = this.isPDP.pipe(
    map((isPDP) =>
      isPDP
        ? `${this.backendConfig.getAssetsPath()}/logos/logo-pdp.svg?version=${this.backendConfig.getVersion()}`
        : this.backendConfig.getLogoPath(),
    ),
  );

  brandName = this.isPDP.pipe(map((isPDP) => (isPDP ? 'Progress Data Platform' : this.backendConfig.getBrandName())));

  signUpUrl = this.isPDP.pipe(
    map((isPDP) => (isPDP ? 'https://progress.com' : 'https://www.progress.com/agentic-rag/free-trial-sign-up')),
  );
}
