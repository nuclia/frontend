import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppInitService, StaticEnvironmentConfiguration } from './app.init.service';

export function init_app(appLoadService: AppInitService, environment: StaticEnvironmentConfiguration) {
  return () => appLoadService.init(environment);
}

@NgModule({
  declarations: [],
  exports: [],
  imports: [CommonModule],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class STFConfigModule {
  static forRoot(environment: any): ModuleWithProviders<STFConfigModule> {
    return {
      ngModule: STFConfigModule,
      providers: [
        {
          provide: 'staticEnvironmentConfiguration',
          useValue: environment,
        },
        AppInitService,
        {
          provide: APP_INITIALIZER,
          useFactory: (loadService: AppInitService) => init_app(loadService, environment),
          deps: [AppInitService],
          multi: true,
        },
      ],
    };
  }
}
