import { TestBed } from '@angular/core/testing';
import { AppInitService } from './app.init.service';
import { BackendConfigurationService } from './backend-config.service';

describe('BackendConfigurationService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        { provide: 'staticEnvironmentConfiguration', useValue: {} },
        {
          provide: AppInitService,
          useValue: {
            getConfig: () => ({
              backend: {},
            }),
          },
        },
      ],
    }),
  );

  it('should be created', () => {
    const service: BackendConfigurationService = TestBed.inject(BackendConfigurationService);
    expect(service).toBeTruthy();
  });
});
