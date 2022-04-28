import { NgModule, ModuleWithProviders, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { AppInitService } from './app.init.service';

export function init_app(appLoadService: AppInitService) {
  return () => appLoadService.init();
}

@NgModule({
  declarations: [],
  imports: [CommonModule, HttpClientModule],
  exports: [],
})
export class STFConfigModule {
  static forRoot(environment: any): ModuleWithProviders<STFConfigModule> {
    return {
      ngModule: STFConfigModule,
      providers: [
        AppInitService,
        {
          provide: APP_INITIALIZER,
          useFactory: init_app,
          deps: [AppInitService],
          multi: true,
        },
        {
          provide: 'staticEnviromentConfiguration',
          useValue: environment,
        },
      ],
    };
  }
}